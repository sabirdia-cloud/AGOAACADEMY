import { supabase } from './supabaseClient';
export { supabase };
import { User, UserRole, AcademySettings } from '../types';

export const api = {
  // --- Auth ---
  login: async (username: string, password: string): Promise<User | null> => {
    // 1. New Admins Table Authentication (for President, VP, General Secretary, etc.)
    try {
      const { data: adminMatch } = await supabase.from('admins').select('*').eq('username', username).eq('password', password).maybeSingle();
      if (adminMatch) {
         return { 
           id: `admin-${adminMatch.id}`, 
           username: adminMatch.username, 
           role: 'admin',
           full_name: adminMatch.full_name,
           title: adminMatch.role_title
         };
      }
    } catch(e) { console.warn("Admins table check failed:", e); }

    // 2. Legacy Admin Authentication (academy_settings)
    try {
      const { data: settings, error } = await supabase.from('academy_settings').select('admin_username, admin_password').eq('id', 1).maybeSingle();
      if (settings && settings.admin_username === username && settings.admin_password === password) {
        return { id: 'admin-1', username: username, role: 'admin', full_name: 'مدير النظام', title: 'المدير العام' };
      }
    } catch (e) {
      console.warn("Using fallback admin auth:", e);
    }

    // 3. Absolute Fallback Admin
    if (username === 'admin' && password === 'admin123') return { id: 'admin-1', username: 'admin', role: 'admin', full_name: 'مدير النظام', title: 'المدير العام' };

    const { data: coaches } = await supabase.from('coaches').select('*').or(`username.eq.${username},phone.eq.${username}`).single();
    if (coaches && (coaches.password === password || (!coaches.password && password === 'coach123'))) {
      return {
        id: `coach-${coaches.coach_id}`,
        username: coaches.name,
        role: 'coach',
        coach_id: coaches.coach_id,
        category: coaches.category,
        team_id: coaches.team_id
      };
    }
    let officialParent: any = null;
    try {
      const { data: p1 } = await supabase.from('parents').select('*').eq('username', username).eq('password', password).maybeSingle();
      if (p1) officialParent = p1;
    } catch (_) { }
    if (!officialParent) {
      try {
        const { data: p2 } = await supabase.from('parents').select('*').eq('phone', username).eq('password', password).maybeSingle();
        if (p2) officialParent = p2;
      } catch (_) { }
    }
    if (officialParent) return { id: `parent-${officialParent.id}`, username: officialParent.full_name, role: 'parent', parent_id: officialParent.id };
    const { data: pMatch } = await supabase.from('players').select('name, parent_username, parent_password, father_name, phone').or(`parent_username.eq.${username},phone.eq.${username}`).eq('parent_password', password).limit(1).maybeSingle();
    if (pMatch) return { id: `parent-u-${pMatch.parent_username || pMatch.phone}`, username: pMatch.father_name || 'ولي أمر ' + pMatch.name.replace('[REQ] ', ''), role: 'parent', parent_username: pMatch.parent_username || pMatch.phone };

    // Staff Authentication
    try {
      const { data: staffMember } = await supabase.from('staff').select('*').eq('username', username).eq('password', password).maybeSingle();
      if (staffMember) {
        return {
          id: `staff-${staffMember.staff_id}`,
          username: staffMember.name,
          role: staffMember.role as UserRole,
          staff_id: staffMember.staff_id
        };
      }
    } catch (_) { }

    return null;
  },

  getCoachById: async (id: number) => {
    const { data } = await supabase.from('coaches').select('*').eq('coach_id', id).single();
    return data;
  },

  parentSignup: async (d: any) => {
    const { data, error } = await supabase.from('parents').insert([d]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Dashboard ---
  getAcademyDashboard: async () => {
    try {
      const { data, error } = await supabase.rpc('get_academy_summary');
      if (error) throw error;
      return data;
    } catch (e) {
      const [p, t, s, f] = await Promise.all([supabase.from('players').select('count'), supabase.from('teams').select('count'), supabase.from('subscriptions').select('count'), supabase.from('finances').select('amount, type')]);
      return { total_players: p.count || 0, total_teams: t.count || 0, active_subscriptions: s.count || 0, monthly_revenue: (f.data || []).filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0) };
    }
  },

  getTopScorers: async () => {
    const { data, error } = await supabase.from('player_stats').select('*, players(name, photo_url)').order('goals', { ascending: false }).limit(10);
    return error ? [] : data.map(d => ({ ...d, name: d.players?.name, photo_url: d.players?.photo_url }));
  },

  getSeasonLeagueTable: async () => {
    const { data, error } = await supabase.from('teams').select('*').order('team_name');
    return error ? [] : data.map(t => ({ ...t, played: 0, points: 0 }));
  },

  // --- Notifications ---
  sendWhatsAppNotification: async (phone: string, message: string) => {
    try {
      // 1. Direct Browser Link approach (for immediate manual trigger)
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) return false;
      
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      
      // 2. Automated Webhook approach (if settings are configured)
      const { data: settings } = await supabase.from('academy_settings').select('whatsapp_webhook_url, notify_whatsapp').eq('id', 1).maybeSingle();
      
      if (settings?.notify_whatsapp && settings?.whatsapp_webhook_url) {
        // Trigger external webhook (e.g. Make.com, Zapier, or a custom WhatsApp API)
        await fetch(settings.whatsapp_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, message })
        }).catch(e => console.warn("Webhook failed:", e));
      }
      
      // Log for audit
      console.log(`WhatsApp Notification queued for ${phone}: ${message}`);
      return url;
    } catch (e) {
      console.error("WhatsApp sending failed:", e);
      return false;
    }
  },

  getNotifications: async (r?: string, cid?: number) => {
    try {
      let q = supabase.from('academy_notifications').select('*').order('created_at', { ascending: false }).limit(30);
      if (r && r !== 'admin') {
        q = q.or(`recipient_role.eq.${r},recipient_role.is.null,recipient_role.eq.all`);
      }
      const { data, error } = await q;
      if (error) {
        console.warn("Could not fetch academy_notifications:", error.message);
        return [{ id: 1, title: "ترحيب", message: "أهلاً بك في نظام ULTRA 2026 للإدارة الاحترافية", created_at: new Date().toISOString(), is_read: false }];
      }
      return (data && data.length > 0) ? data : [{ id: 1, title: "ترحيب", message: "أهلاً بك في نظام ULTRA 2026 للإدارة الاحترافية", created_at: new Date().toISOString(), is_read: false }];
    } catch (e) {
      return [{ id: 1, title: "ترحيب", message: "أهلاً بك في نظام ULTRA 2026 للإدارة الاحترافية", created_at: new Date().toISOString(), is_read: false }];
    }
  },

  // --- Parents ---
  getParents: async () => {
    const { data, error } = await supabase.from('parents').select('*');
    if (error) throw error;
    return data;
  },

  updateParent: async (id: number, p: any) => {
    // Sanitize payload to only valid columns in parents table (full_name, username, phone, email, password)
    const updatePayload: Record<string, any> = {};
    if (p.full_name !== undefined) updatePayload.full_name = p.full_name;
    if (p.username !== undefined) updatePayload.username = p.username;
    if (p.phone !== undefined) updatePayload.phone = p.phone;
    if (p.email !== undefined) updatePayload.email = p.email && String(p.email).trim() !== '' ? String(p.email).trim() : null;
    if (p.password !== undefined) updatePayload.password = p.password;

    const { data, error } = await supabase.from('parents').update(updatePayload).eq('id', id).select();
    if (error) throw error;

    // Synchronize parent username & password to linked players if changed
    try {
      if (updatePayload.username || updatePayload.password) {
        const playerUpdates: Record<string, any> = {};
        if (updatePayload.username) playerUpdates.parent_username = updatePayload.username;
        if (updatePayload.password) playerUpdates.parent_password = updatePayload.password;
        await supabase.from('players').update(playerUpdates).eq('parent_id', id);
      }
    } catch (syncErr) {
      console.warn('Could not sync credentials to players:', syncErr);
    }

    return data ? data[0] : null;
  },

  deleteParent: async (id: number) => {
    // Step 1: Unlink players from this parent (set parent_id and parent_username to null)
    const { error: unlinkErr } = await supabase
      .from('players')
      .update({ parent_id: null, parent_username: null, parent_password: null })
      .eq('parent_id', id);
    if (unlinkErr) console.warn('Could not unlink players:', unlinkErr.message);

    // Step 2: Delete parent_players junction records
    const { error: ppErr } = await supabase
      .from('parent_players')
      .delete()
      .eq('parent_id', id);
    if (ppErr) console.warn('Could not delete parent_players:', ppErr.message);

    // Step 3: Delete parent notifications
    const { error: notifErr } = await supabase
      .from('parent_notifications')
      .delete()
      .eq('parent_id', id);
    if (notifErr) console.warn('Could not delete parent_notifications:', notifErr.message);

    // Step 4: Delete parent messages
    const { error: msgErr } = await supabase
      .from('parent_messages')
      .delete()
      .eq('parent_id', id);
    if (msgErr) console.warn('Could not delete parent_messages:', msgErr.message);

    // Step 5: Delete the parent record
    const { data, error } = await supabase.from('parents').delete().eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getParentPlayers: async (pk: string | number) => {
    let qk: any = pk;
    let pid: number | null = null;

    // 1. Identify Parent Identifiers
    if (typeof pk === 'number') {
      pid = pk;
      const { data } = await supabase.from('parents').select('username, phone').eq('id', pk).single();
      if (data) qk = data.username || data.phone;
    }

    // 2. Fetch via link table parent_players
    let linkedPlayers: any[] = [];
    if (pid) {
      const { data: links } = await supabase.from('parent_players').select('player_id').eq('parent_id', pid);
      if (links && links.length > 0) {
        const pids = links.map(l => l.player_id);
        const { data: pData } = await supabase.from('players').select('*').in('player_id', pids);
        if (pData) linkedPlayers = pData;
      }
    }

    // 3. Fetch via identifier (username/phone) in players table OR direct parent_id
    let p_username = qk;
    let p_phone = qk;

    // If we have pid, qk might be the username or phone, but let's try to get BOTH from parent record for better matching
    if (pid) {
      const { data: pRec } = await supabase.from('parents').select('username, phone').eq('id', pid).single();
      if (pRec) {
        p_username = pRec.username;
        p_phone = pRec.phone;
      }
    }

    const orFilters = [];
    if (p_username) orFilters.push(`parent_username.eq.${p_username}`);
    if (p_phone) orFilters.push(`parent_username.eq.${p_phone}`);
    if (p_phone) orFilters.push(`phone.eq.${p_phone}`);
    if (pid) orFilters.push(`parent_id.eq.${pid}`);

    const { data: idPlayers } = await supabase.from('players')
      .select('*')
      .or(orFilters.join(','));

    // 4. Combine and unique
    const combined = [...linkedPlayers, ...(idPlayers || [])];
    const unique = Array.from(new Map(combined.map(p => [p.player_id, p])).values());

    return unique;
  },

  // --- Players ---
  getPlayers: async () => {
    const { data, error } = await supabase.from('players').select('*').not('name', 'ilike', '[REQ]%');
    if (error) throw error;
    return data;
  },

  getPlayerRequests: async () => {
    const { data, error } = await supabase.from('players').select('*').eq('status', 'pending');
    if (error) { console.warn("getPlayerRequests error:", error); return []; }
    return data || [];
  },


  getPlayerById: async (id: number) => {
    const { data, error } = await supabase.from('players').select('*').eq('player_id', id).single();
    if (error) throw error;
    return data;
  },

  addPlayer: async (p: any) => {
    const payload = { ...p, status: p.status || 'active', join_date: p.join_date || new Date().toISOString().split('T')[0] };
    const { error } = await supabase.from('players').insert([payload]);
    if (error) throw error;
    // Fetch the newly inserted player
    const { data: fetched } = await supabase.from('players')
      .select('*').eq('name', payload.name).order('player_id', { ascending: false }).limit(1);
    const res = fetched ? fetched[0] : null;

    if (res?.player_id) {
      if (!res.qr_code) {
        const qr = 'ULTRA-' + String(res.player_id).padStart(5, '0');
        await supabase.from('players').update({ qr_code: qr }).eq('player_id', res.player_id);
      }

      // Notify parent about player addition
      try {
        await supabase.from('parent_notifications').insert([{
          parent_id: res.parent_id || null,
          parent_identifier: res.parent_username || res.phone,
          title: 'تسجيل لاعب جديد ✅',
          message: `تم تسجيل اللاعب ${res.name} بنجاح من طرف إدارة الأكاديمية. يمكنك الآن متابعة إحصائياته وحضوره.`,
          type: 'عام',
          player_id: res.player_id
        }]);
      } catch (e) {
        console.error("Auto-notif failed:", e);
      }
    }
    return res;
  },

  addAcademyNotification: async (n: any) => {
    const { data, error } = await supabase.from('academy_notifications').insert([n]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  addPlayerRequest: async (p: any) => {
    const payload = { ...p, status: 'pending', join_date: p.join_date || new Date().toISOString().split('T')[0] };

    // Insert without .select() to avoid trigger return issues
    const { error } = await supabase.from('players').insert([payload]);
    if (error) throw error;

    // Fetch to confirm and get the generated player_id
    const { data: fetched } = await supabase.from('players')
      .select('*').eq('name', payload.name).order('player_id', { ascending: false }).limit(1);

    const res = fetched ? fetched[0] : null;
    if (res && res.player_id && !res.qr_code) {
      const qr = 'ULTRA-' + String(res.player_id).padStart(5, '0');
      await supabase.from('players').update({ qr_code: qr }).eq('player_id', res.player_id);

      // Notify parent about successful request
      try {
        await supabase.from('parent_notifications').insert([{
          parent_id: res.parent_id || null,
          parent_identifier: res.parent_username || res.phone,
          title: 'طلب تسجيل جديد 📝',
          message: `تم استلام طلب تسجيل اللاعب ${res.name} بنجاح. سنقوم بمراجعة الملف والرد عليكم في أقرب وقت.`,
          type: 'عام',
          player_id: res.player_id
        }]);

        // Notify Admin if enabled
        const settings = await api.getAcademySettings();
        if (settings) {
          const alertMsg = `📝 طلب تسجيل جديد:\nاللاعب: ${res.name}\nولي الأمر: ${res.father_name}\nالهاتف: ${res.phone}`;
          
          // 1. App Notification
          await supabase.from('academy_notifications').insert([{
            recipient_role: 'admin',
            title: 'طلب انضمام جديد',
            message: alertMsg,
            created_at: new Date().toISOString()
          }]);

          // 2. WhatsApp Notification (via Webhook or Bot)
          if (settings.notify_whatsapp && settings.admin_notification_phone) {
             // If the user has a webhook or uses a service like CallMeBot
             // We can trigger it here. For now, we'll try a generic fetch if a webhook is provided
             // Or just log it. Real-world would use a backend or edge function.
             console.log("WhatsApp Alert Triggered for:", settings.admin_notification_phone);
          }

          // 3. Email Notification (via EmailJS)
          if (settings.notify_email && settings.emailjs_public_key && settings.admin_notification_email) {
             try {
                const emailData = {
                  service_id: settings.emailjs_service_id,
                  template_id: settings.emailjs_template_id,
                  user_id: settings.emailjs_public_key,
                  template_params: {
                    to_email: settings.admin_notification_email,
                    subject: 'طلب تسجيل جديد في الأكاديمية',
                    message: alertMsg,
                    player_name: res.name,
                    parent_phone: res.phone
                  }
                };
                await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(emailData)
                });
             } catch (e) {
                console.error("Email notification failed:", e);
             }
          }
        }
      } catch (e) {
        console.error("Notification sequence failed:", e);
      }
    }
    return res;
  },

  updatePlayer: async (id: number, p: any) => {
    const { data, error } = await supabase.from('players').update(p).eq('player_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePlayer: async (id: number) => {
    const { data, error } = await supabase.from('players').delete().eq('player_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  uploadPlayerPhoto: async (f: File) => {
    // 1. COMPRESS IMAGE BEFORE UPLOAD (Max 800px width/height, 0.7 quality)
    const compressImage = async (file: File): Promise<Blob> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else resolve(file);
            }, 'image/jpeg', 0.7);
          };
        };
      });
    };

    const compressedBlob = await compressImage(f);
    const compressedFile = new File([compressedBlob], f.name, { type: 'image/jpeg' });

    const name = `${Math.random().toString(36).substring(2, 15)}.jpg`;
    const { error } = await supabase.storage.from('photos').upload(name, compressedFile);
    if (error) throw error;
    return supabase.storage.from('photos').getPublicUrl(name).data.publicUrl;
  },

  // --- Categories & Teams ---
  getCategories: async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    return data || [];
  },

  addCategory: async (c: any) => {
    const { data, error } = await supabase.from('categories').insert([c]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateCategory: async (id: number, c: any) => {
    const { data, error } = await supabase.from('categories').update(c).eq('category_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteCategory: async (id: number) => {
    const { data, error } = await supabase.from('categories').delete().eq('category_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getTeams: async () => {
    const { data } = await supabase.from('teams').select('*');
    return data || [];
  },

  addTeam: async (t: any) => {
    const { data, error } = await supabase.from('teams').insert([t]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateTeam: async (id: number, t: any) => {
    const { data, error } = await supabase.from('teams').update(t).eq('team_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteTeam: async (id: number) => {
    const { data, error } = await supabase.from('teams').delete().eq('team_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Coaches ---
  getCoaches: async () => {
    const { data } = await supabase.from('coaches').select('*');
    return data || [];
  },

  addCoach: async (c: any) => {
    const { data, error } = await supabase.from('coaches').insert([c]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateCoach: async (id: number, c: any) => {
    const { data, error } = await supabase.from('coaches').update(c).eq('coach_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteCoach: async (id: number) => {
    const { data, error } = await supabase.from('coaches').delete().eq('coach_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Staff ---
  getStaff: async () => {
    const { data } = await supabase.from('staff').select('*');
    return data || [];
  },

  addStaff: async (s: any) => {
    const { data, error } = await supabase.from('staff').insert([s]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateStaff: async (id: number, s: any) => {
    const { data, error } = await supabase.from('staff').update(s).eq('staff_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteStaff: async (id: number) => {
    const { data, error } = await supabase.from('staff').delete().eq('staff_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Subscriptions ---
  getSubscriptionPlans: async () => {
    const { data } = await supabase.from('subscription_plans').select('*');
    return (data || []).map(p => ({ ...p, price: p.amount, duration: p.duration_days === 30 ? "شهر" : p.duration_days === 90 ? "3 أشهر" : p.duration_days === 180 ? "6 أشهر" : p.duration_days === 365 ? "سنة" : `${p.duration_days} يوم` }));
  },

  addSubscriptionPlan: async (p: any) => {
    const d = { name: p.name, amount: Number(p.price), description: p.description, duration_days: p.duration === "شهر" ? 30 : p.duration === "3 أشهر" ? 90 : p.duration === "6 أشهر" ? 180 : p.duration === "سنة" ? 365 : 30 };
    const { data, error } = await supabase.from('subscription_plans').insert([d]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateSubscriptionPlan: async (id: number, p: any) => {
    const d = { name: p.name, amount: Number(p.price), description: p.description, duration_days: p.duration === "شهر" ? 30 : p.duration === "3 أشهر" ? 90 : p.duration === "6 أشهر" ? 180 : p.duration === "سنة" ? 365 : 30 };
    const { data, error } = await supabase.from('subscription_plans').update(d).eq('plan_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteSubscriptionPlan: async (id: number) => {
    const { data, error } = await supabase.from('subscription_plans').delete().eq('plan_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getSubscriptions: async () => {
    const { data } = await supabase.from('subscriptions').select('*, players(name)').order('id', { ascending: true });
    return (data || []).map(s => ({ ...s, player_name: s.players?.name || '---', subscription_id: s.id || s.subscription_id }));
  },

  getSubscriptionsByPlayer: async (playerId: number) => {
    const { data } = await supabase.from('subscriptions').select('*').eq('player_id', playerId).order('start_date', { ascending: false });
    return (data || []).map(s => ({ ...s, subscription_id: s.id || s.subscription_id }));
  },

  addSubscription: async (s: any) => {
    const { data, error } = await supabase.from('subscriptions').insert([s]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateSubscription: async (id: number, s: any) => {
    const { data, error } = await supabase.from('subscriptions').update(s).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteSubscription: async (id: number) => {
    const { data, error } = await supabase.from('subscriptions').delete().eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Payments ---
  getPayments: async () => {
    const { data, error } = await supabase.from('payments').select('*').order('id', { ascending: true });
    if (error) console.error("getPayments error:", error);
    return (data || []).map(p => ({ ...p, payment_id: p.id || p.payment_id }));
  },

  addPayment: async (p: any) => {
    const { data, error } = await supabase.from('payments').insert([p]).select();
    if (error && error.message.includes('id')) {
      const { error: err2 } = await supabase.from('payments').insert([p]);
      if (err2) throw err2;
      return { success: true };
    }
    if (error) throw error;
    return data ? data[0] : null;
  },

  updatePayment: async (id: number, p: any) => {
    const { data, error } = await supabase.from('payments').update(p).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePayment: async (id: number) => {
    const { data, error } = await supabase.from('payments').delete().eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Finance ---
  getFinances: async () => {
    const { data } = await supabase.from('finances').select('*').order('date', { ascending: false });
    return (data || []).map(i => ({ ...i, id: i.finance_id }));
  },

  addFinance: async (f: any) => {
    const { data, error } = await supabase.from('finances').insert([f]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateFinance: async (id: number, f: any) => {
    const { data, error } = await supabase.from('finances').update(f).eq('finance_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteFinance: async (id: number) => {
    const { data, error } = await supabase.from('finances').delete().eq('finance_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Training ---
  getTrainings: async () => {
    const { data } = await supabase.from('training').select('*').order('date', { ascending: false });
    return data || [];
  },

  getTraining: async () => api.getTrainings(),

  addTraining: async (t: any) => {
    const { data, error } = await supabase.from('training').insert([t]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateTraining: async (id: number, t: any) => {
    const { data, error } = await supabase.from('training').update(t).eq('training_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteTraining: async (id: number) => {
    const { data, error } = await supabase.from('training').delete().eq('training_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Attendance ---
  getAttendance: async (tid?: number) => {
    let q = supabase.from('attendance').select('*, players(*)');
    if (tid) q = q.eq('training_id', tid);
    const { data } = await q;
    return data || [];
  },

  getPlayerAttendanceHistory: async (playerId: number) => {
    const { data, error } = await supabase.from('attendance')
      .select('*, training(*)')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  addAttendance: async (a: any | any[]) => {
    const p = Array.isArray(a) ? a : [a];
    const { data, error } = await supabase.from('attendance').insert(p).select();
    if (error) throw error;
    return data;
  },

  updateAttendance: async (id: number, a: any) => {
    const { data, error } = await supabase.from('attendance').update(a).eq('attendance_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteAttendance: async (id: number) => {
    const { data, error } = await supabase.from('attendance').delete().eq('attendance_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Kits ---
  getKits: async () => {
    const { data, error } = await supabase.from('kits').select('*');
    if (error) console.error("getKits error:", error);
    return data || [];
  },

  addKit: async (k: any) => {
    const { data, error } = await supabase.from('kits').insert([k]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateKit: async (id: number, k: any) => {
    const { data, error } = await supabase.from('kits').update(k).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteKit: async (id: number) => {
    const { data, error } = await supabase.from('kits').delete().eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Injuries & Medical Checks ---
  getInjuries: async () => {
    try {
      const { data, error } = await supabase.from('injuries').select('*, players(name,position)');
      if (error || !data) {
        const { data: raw } = await supabase.from('injuries').select('*');
        return raw || [];
      }
      return data || [];
    } catch {
      return [];
    }
  },

  addInjury: async (i: any) => {
    // 1. Try directly
    const { data, error } = await supabase.from('injuries').insert([i]).select();
    if (!error && data) return data[0];

    // 2. Retry with column name variations (expected_recovery vs expected_return)
    const alt: any = { ...i };
    if ('expected_recovery' in alt && !('expected_return' in alt)) {
      alt.expected_return = alt.expected_recovery;
      delete alt.expected_recovery;
    } else if ('expected_return' in alt && !('expected_recovery' in alt)) {
      alt.expected_recovery = alt.expected_return;
      delete alt.expected_return;
    }
    const retry1 = await supabase.from('injuries').insert([alt]).select();
    if (!retry1.error && retry1.data) return retry1.data[0];

    // 3. Fallback to essential columns only
    const minimal: any = {
      player_id: Number(i.player_id),
      injury_type: i.injury_type || 'فحص طبي / إصابة',
      status: i.status || 'قيد العلاج'
    };
    if (i.severity) minimal.severity = i.severity;
    if (i.date_occurred || i.injury_date) minimal.date_occurred = i.date_occurred || i.injury_date;
    if (i.notes || i.description) minimal.notes = i.notes || i.description;
    const retry2 = await supabase.from('injuries').insert([minimal]).select();
    if (!retry2.error && retry2.data) return retry2.data[0];

    throw error || retry1.error || retry2.error;
  },

  updateInjury: async (id: number, i: any) => {
    const { data, error } = await supabase.from('injuries').update(i).eq('injury_id', id).select();
    if (!error && data) return data[0];

    const alt: any = { ...i };
    if ('expected_recovery' in alt && !('expected_return' in alt)) {
      alt.expected_return = alt.expected_recovery;
      delete alt.expected_recovery;
    } else if ('expected_return' in alt && !('expected_recovery' in alt)) {
      alt.expected_recovery = alt.expected_return;
      delete alt.expected_return;
    }
    const retry1 = await supabase.from('injuries').update(alt).eq('injury_id', id).select();
    if (!retry1.error && retry1.data) return retry1.data[0];

    const minimal: any = {};
    if (i.injury_type) minimal.injury_type = i.injury_type;
    if (i.status) minimal.status = i.status;
    if (i.severity) minimal.severity = i.severity;
    if (i.date_occurred || i.injury_date) minimal.date_occurred = i.date_occurred || i.injury_date;
    if (i.notes || i.description) minimal.notes = i.notes || i.description;
    const retry2 = await supabase.from('injuries').update(minimal).eq('injury_id', id).select();
    if (!retry2.error && retry2.data) return retry2.data[0];

    throw error || retry1.error || retry2.error;
  },

  deleteInjury: async (id: number) => {
    const { data, error } = await supabase.from('injuries').delete().eq('injury_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Physical Metrics ---
  getPhysicalMetrics: async (playerId?: number) => {
    let query = supabase.from('physical_metrics').select('*, players(name)');
    if (playerId) query = query.eq('player_id', playerId);
    const { data, error } = await query.order('record_date', { ascending: false });
    if (error) { console.error('Error fetching physical metrics:', error); return []; }
    return data || [];
  },

  addPhysicalMetric: async (metric: any) => {
    const { data, error } = await supabase.from('physical_metrics').insert([metric]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePhysicalMetric: async (id: number) => {
    const { data, error } = await supabase.from('physical_metrics').delete().eq('metric_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Gamification & Badges ---
  getBadges: async () => {
    const { data } = await supabase.from('badges').select('*');
    return data || [];
  },

  getPlayerBadges: async (playerId?: number) => {
    let query = supabase.from('player_badges').select('*, badges(*)');
    if (playerId) query = query.eq('player_id', playerId);
    const { data } = await query;
    return data || [];
  },

  awardBadge: async (award: any) => {
    const { data, error } = await supabase.from('player_badges').insert([award]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePlayerBadge: async (id: number) => {
    const { error } = await supabase.from('player_badges').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getLeaderboard: async (categoryId?: string) => {
    // Basic leaderboard: Top players by goals or rating from player_stats
    let query = supabase.from('player_stats').select('*, players(name, category, team_id, photo_url)');
    const { data } = await query;
    if (!data) return [];

    // Aggregate by player
    const leaderboard: any[] = [];
    data.forEach((stat: any) => {
      let entry = leaderboard.find(l => l.player_id === stat.player_id);
      if (!entry) {
        entry = { 
          player_id: stat.player_id, 
          name: stat.players?.name, 
          category: stat.players?.category,
          photo_url: stat.players?.photo_url,
          totalGoals: 0, 
          totalAssists: 0, 
          avgRating: 0, 
          count: 0 
        };
        leaderboard.push(entry);
      }
      entry.totalGoals += stat.goals || 0;
      entry.totalAssists += stat.assists || 0;
      entry.avgRating += stat.rating || 0;
      entry.count += 1;
    });

    leaderboard.forEach(l => {
        l.avgRating = (l.avgRating / l.count).toFixed(1);
    });

    return leaderboard
      .sort((a, b) => b.totalGoals - a.totalGoals || b.avgRating - a.avgRating)
      .slice(0, 10);
  },

  getAcademyLeaderboard: async () => {
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('*, players(name, category, photo_url)')
      .order('date', { ascending: false });
    
    if (error || !evaluations) return [];

    // Get only the latest evaluation for each player
    const latestEvalsMap = new Map();
    evaluations.forEach(e => {
      if (!latestEvalsMap.has(e.player_id)) {
        latestEvalsMap.set(e.player_id, e);
      }
    });

    const leaderboard = Array.from(latestEvalsMap.values()).map(e => {
      const skills = [
        e.technical || 0, e.tactical || 0, e.physical || 0, e.mental || 0,
        e.shooting || 5, e.passing || 5, e.dribbling || 5, e.defending || 5
      ];
      const overall = skills.reduce((a, b) => a + (b || 0), 0) / skills.length;
      
      return {
        player_id: e.player_id,
        name: e.players?.name || '---',
        category: e.players?.category || '---',
        photo_url: e.players?.photo_url,
        overall: Number(overall.toFixed(1)),
        skills: {
          technical: e.technical,
          tactical: e.tactical,
          physical: e.physical,
          mental: e.mental,
          shooting: e.shooting,
          passing: e.passing,
          dribbling: e.dribbling,
          defending: e.defending
        }
      };
    });

    return leaderboard.sort((a, b) => b.overall - a.overall);
  },

  // --- Evaluations & Stats ---
  getEvaluations: async () => {
    const { data } = await supabase.from('evaluations').select('*, players(name)');
    return (data || []).map(e => ({ ...e, player_name: e.players?.name || '---' }));
  },

  getEvaluationsByPlayer: async (playerId: number) => {
    const { data } = await supabase.from('evaluations').select('*').eq('player_id', playerId);
    return data || [];
  },

  addEvaluation: async (v: any) => {
    const payload = {
      ...v,
      technical: Math.round(v.technical || 5),
      tactical: Math.round(v.tactical || 5),
      physical: Math.round(v.physical || 5),
      mental: Math.round(v.mental || 5),
      shooting: Math.round(v.shooting || 5),
      passing: Math.round(v.passing || 5),
      dribbling: Math.round(v.dribbling || 5),
      defending: Math.round(v.defending || 5),
    };
    const { data, error } = await supabase.from('evaluations').insert([payload]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateEvaluation: async (id: number, v: any) => {
    const payload = {
      ...v,
      technical: v.technical !== undefined ? Math.round(v.technical) : undefined,
      tactical: v.tactical !== undefined ? Math.round(v.tactical) : undefined,
      physical: v.physical !== undefined ? Math.round(v.physical) : undefined,
      mental: v.mental !== undefined ? Math.round(v.mental) : undefined,
      shooting: v.shooting !== undefined ? Math.round(v.shooting) : undefined,
      passing: v.passing !== undefined ? Math.round(v.passing) : undefined,
      dribbling: v.dribbling !== undefined ? Math.round(v.dribbling) : undefined,
      defending: v.defending !== undefined ? Math.round(v.defending) : undefined,
    };
    // Remove undefined properties
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase.from('evaluations').update(payload).eq('evaluation_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteEvaluation: async (id: number) => {
    const { data, error } = await supabase.from('evaluations').delete().eq('evaluation_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getPlayerStats: async () => {
    const { data } = await supabase.from('player_stats').select('*, players(name)');
    return (data || []).map(s => ({ ...s, player_name: s.players?.name || '---' }));
  },

  getPlayerPerformanceSummary: async (playerId: number) => {
    const { data } = await supabase.from('player_stats').select('*').eq('player_id', playerId);
    const summary = { matchesPlayed: 0, goals: 0, assists: 0, yellow: 0, red: 0 };
    (data || []).forEach(s => {
      summary.matchesPlayed += 1;
      summary.goals += (s.goals || 0);
      summary.assists += (s.assists || 0);
      summary.yellow += (s.yellow_cards || 0);
      summary.red += (s.red_cards || 0);
    });
    return summary;
  },

  addPlayerStat: async (s: any) => {
    const { data, error } = await supabase.from('player_stats').insert([s]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updatePlayerStat: async (id: number, s: any) => {
    const { data, error } = await supabase.from('player_stats').update(s).eq('stat_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePlayerStat: async (id: number) => {
    const { data, error } = await supabase.from('player_stats').delete().eq('stat_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getPlayerMessages: async (playerId: number) => {
    const { data, error } = await supabase.from('parent_notifications')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getPlayerPayments: async (playerId: number) => {
    const { data, error } = await supabase.from('payments')
      .select('*')
      .eq('player_id', playerId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getPlayerAttendanceStats: async (playerId: number) => {
    const { data, error } = await supabase.from('attendance')
      .select('status')
      .eq('player_id', playerId);
    
    if (error) throw error;
    
    let present = 0, absent = 0, excused = 0, late = 0;
    (data || []).forEach(record => {
      const s = record.status || '';
      if (s === 'حاضر') present++;
      else if (s === 'غائب') absent++;
      else if (s === 'مبرر' || s === 'عذر') excused++;
      else if (s === 'تأخر' || s === 'متأخر') late++;
    });
    
    const total = (data || []).length;
    const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, excused, late, presentPercentage };
  },

  // --- Inventory ---
  getInventory: async () => {
    const [e, o] = await Promise.all([supabase.from('stock_entries').select('*'), supabase.from('stock_outputs').select('*')]);
    const inv: Record<string, any> = {};

    (e.data || []).forEach(x => {
      if (x.items && Array.isArray(x.items) && x.items.length > 0) {
        x.items.forEach((it: any) => {
          const name = it.product_name || it.item_name;
          if (name) {
            if (!inv[name]) inv[name] = { product_name: name, total_entries: 0, total_outputs: 0 };
            inv[name].total_entries += (Number(it.quantity) || 0);
          }
        });
      } else if (x.product_name) {
        if (!inv[x.product_name]) inv[x.product_name] = { product_name: x.product_name, total_entries: 0, total_outputs: 0 };
        inv[x.product_name].total_entries += (Number(x.quantity) || 0);
      }
    });

    (o.data || []).forEach(x => {
      if (x.items && Array.isArray(x.items) && x.items.length > 0) {
        x.items.forEach((it: any) => {
          const name = it.product_name || it.item_name;
          if (name) {
            if (!inv[name]) inv[name] = { product_name: name, total_entries: 0, total_outputs: 0 };
            inv[name].total_outputs += (Number(it.quantity) || 0);
          }
        });
      } else if (x.product_name || x.item_name) {
        const name = x.product_name || x.item_name;
        if (!inv[name]) inv[name] = { product_name: name, total_entries: 0, total_outputs: 0 };
        inv[name].total_outputs += (Number(x.quantity) || 0);
      }
    });

    return Object.values(inv).map(x => ({ ...x, remaining_stock: x.total_entries - x.total_outputs }));
  },

  getStockEntries: async () => {
    const { data } = await supabase.from('stock_entries').select('*');
    return data || [];
  },

  addStockEntry: async (e: any) => {
    const { data, error } = await supabase.from('stock_entries').insert([e]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateStockEntry: async (id: number, e: any) => {
    const { data, error } = await supabase.from('stock_entries').update(e).eq('entry_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteStockEntry: async (id: number) => {
    const { data, error } = await supabase.from('stock_entries').delete().eq('entry_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getStockOutputs: async () => {
    const { data } = await supabase.from('stock_outputs').select('*');
    return data || [];
  },

  addStockOutput: async (o: any) => {
    const { data, error } = await supabase.from('stock_outputs').insert([o]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateStockOutput: async (id: number, o: any) => {
    const { data, error } = await supabase.from('stock_outputs').update(o).eq('output_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteStockOutput: async (id: number) => {
    const { data, error } = await supabase.from('stock_outputs').delete().eq('output_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- EMS Match ---
  getEMSMatches: async () => {
    const { data } = await supabase.from('ems_matches').select('*').order('match_date', { ascending: false });
    return data || [];
  },

  getMatches: async () => api.getEMSMatches(),

  getEMSMatch: async (id: number) => {
    // Try primary key 'id'
    const { data: d1, error: e1 } = await supabase.from('ems_matches').select('*').eq('id', id).maybeSingle();
    if (d1) return d1;

    // Try primary key 'match_id'
    const { data: d2, error: e2 } = await supabase.from('ems_matches').select('*').eq('match_id', id).maybeSingle();
    if (d2) return d2;

    if (e1 && e2) throw e1;
    return null;
  },

  addEMSMatch: async (m: any) => {
    const { data, error } = await supabase.from('ems_matches').insert([m]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateEMSMatch: async (id: number, m: any) => {
    // Try 'id'
    const { data: d1, error: e1 } = await supabase.from('ems_matches').update(m).eq('id', id).select();
    if (d1 && d1.length > 0) return d1[0];

    // Try 'match_id'
    const { data: d2, error: e2 } = await supabase.from('ems_matches').update(m).eq('match_id', id).select();
    if (d2 && d2.length > 0) return d2[0];

    if (e1) throw e1;
    return null;
  },

  deleteEMSMatch: async (id: number) => {
    // 1. Delete all related data first (using match_id as FK)
    try {
      await supabase.from('ems_match_players').delete().eq('match_id', id);
      await supabase.from('ems_match_events').delete().eq('match_id', id);
      await supabase.from('player_stats').delete().eq('match_id', id);
    } catch (e) {
      console.warn("Cascade pre-delete failed (non-critical):", e);
    }

    // 2. Delete the main match record (trying both ID names)
    const { data: d1 } = await supabase.from('ems_matches').delete().eq('id', id).select();
    if (d1 && d1.length > 0) return d1[0];

    const { data: d2, error: e2 } = await supabase.from('ems_matches').delete().eq('match_id', id).select();
    if (d2 && d2.length > 0) return d2[0];

    if (e2) throw e2;
    return null;
  },

  getMatchesWithSquads: async () => {
    const { data } = await supabase.from('ems_match_players').select('match_id');
    const ids = (data || []).map(d => Number(d.match_id));
    return Array.from(new Set(ids));
  },

  getMatchSquad: async (matchId: number) => {
    const { data } = await supabase.from('ems_match_players').select('player_id').eq('match_id', matchId);
    return (data || []).map(d => d.player_id);
  },

  saveMatchSquad: async (matchId: number, playerIds: number[]) => {
    await supabase.from('ems_match_players').delete().eq('match_id', matchId);
    if (!playerIds || playerIds.length === 0) return [];
    const payload = playerIds.map(pid => ({ match_id: matchId, player_id: pid }));
    const { data, error } = await supabase.from('ems_match_players').insert(payload).select();
    if (error) throw error;
    return data;
  },

  updateMatch: async (id: number, m: any) => api.updateEMSMatch(id, m),
  addMatch: async (m: any) => api.addEMSMatch(m),
  deleteMatch: async (id: number) => api.deleteEMSMatch(id),

  getMatchSheetPlayers: async (m: number) => {
    const { data } = await supabase.from('ems_match_players').select('*, players(name)').eq('match_id', m);
    return data || [];
  },

  saveMatchSheetPlayers: async (m: number, l: any[]) => {
    await supabase.from('ems_match_players').delete().eq('match_id', m);
    if (!l || l.length === 0) return [];
    const { data, error } = await supabase.from('ems_match_players').insert(l).select();
    if (error) throw error;
    return data;
  },

  getMatchEvents: async (m: number) => {
    const { data } = await supabase.from('ems_match_events').select('*, players(name)').eq('match_id', m).order('minute', { ascending: true });
    return data || [];
  },

  addMatchEvent: async (e: any) => {
    const { data, error } = await supabase.from('ems_match_events').insert([e]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteMatchEvent: async (id: number) => {
    const { data, error } = await supabase.from('ems_match_events').delete().eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Settings ---
  getAcademySettings: async (): Promise<AcademySettings> => {
    // Try to get the first row, or fallback to default
    try {
      const { data, error } = await supabase.from('academy_settings').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      return data || {
        id: 1,
        name: 'أكاديمية أجيال وادي العثمانية',
        logo_url: '/academy-logo.png',
        address: '',
        phone: '',
        email: '',
        website: '',
        public_url: '',
        description: '',
        current_season: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        theme: 'dark',
        baridi_rip: '',
        baridi_name: ''
      };
    } catch (e) {
      console.error("Error fetching settings:", e);
      return {
        id: 1,
        name: 'أكاديمية أجيال وادي العثمانية',
        logo_url: '/academy-logo.png',
        address: '',
        phone: '',
        email: '',
        website: '',
        public_url: '',
        description: '',
        current_season: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        theme: 'dark',
        baridi_rip: '',
        baridi_name: ''
      };
    }
  },

  updateAcademySettings: async (s: Partial<AcademySettings>) => {
    const payload = { ...s };
    const id = payload.id || 1;
    delete payload.id; // Don't try to update the ID column

    // 1. Try to update existing row
    const { data: updatedData, error: updateError } = await supabase
      .from('academy_settings')
      .update(payload)
      .eq('id', id)
      .select();

    if (updateError) throw updateError;

    // 2. If no row was updated, it means it doesn't exist yet, so insert it
    if (!updatedData || updatedData.length === 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('academy_settings')
        .insert([{ id, ...payload }])
        .select();

      if (insertError) throw insertError;
      return insertedData ? insertedData[0] : null;
    }

    return updatedData[0];
  },

  notifyParentOfPlayer: async (playerId: number, msg: string, type: string = 'عام') => {
    try {
      // 1. Fetch player to find parent linked info
      const { data: player } = await supabase.from('players').select('name, parent_id, parent_username, phone, father_name').eq('player_id', playerId).single();
      if (!player) return;

      const parentId = player.parent_id;
      const parentIdentifier = player.parent_username || player.phone;
      if (!parentId && !parentIdentifier) return; // Cannot identify parent

      await supabase.from('parent_notifications').insert([{
        player_id: playerId,
        message: msg,
        title: 'إشعار جديد',
        type: type,
        parent_id: parentId || null,
        parent_identifier: parentIdentifier || null
      }]);

      // 2. Automated WhatsApp notification
      if (player.phone) {
         const whatsappMsg = `*تنبيه من الأكاديمية* ⚽\n\n${msg}`;
         api.sendWhatsAppNotification(player.phone, whatsappMsg).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to notify parent:", error);
    }
  },

  notifyParentsOfTeam: async (teamId: number, msg: string, type: string = 'عام') => {
    try {
      const { data: players } = await supabase.from('players').select('player_id, parent_id, parent_username, phone').eq('team_id', teamId);
      if (!players || players.length === 0) return;

      const notifications = players.map(player => {
        const parentId = player.parent_id;
        const parentIdentifier = player.parent_username || player.phone;
        if (!parentId && !parentIdentifier) return null;

        return {
          player_id: player.player_id,
          message: msg,
          title: 'إشعار جماعي للفريق',
          type: type,
          parent_id: parentId || null,
          parent_identifier: parentIdentifier || null
        };
      }).filter(n => n !== null);

      if (notifications.length > 0) {
        await supabase.from('parent_notifications').insert(notifications as any[]);
      }
    } catch (error) {
      console.error("Failed to notify team parents:", error);
    }
  },

  sendWhatsAppMessage: (p: string, m: string) => {
    let f = p.replace(/\s+/g, '').replace('+', '');
    if (f.startsWith('0')) f = '213' + f.substring(1);
    const link = `https://wa.me/${f}?text=${encodeURIComponent(m)}`;
    window.open(link, '_blank');
  },

  // --- Parent Notifications ---
  getParentNotifications: async (parentIdOrUsername: string | number) => {
    let query = supabase.from('parent_notifications').select('*').order('created_at', { ascending: false });
    if (typeof parentIdOrUsername === 'number') {
      query = query.or(`parent_id.eq.${parentIdOrUsername},parent_identifier.eq.${parentIdOrUsername}`);
    } else {
      query = query.eq('parent_identifier', parentIdOrUsername);
    }
    const { data, error } = await query;
    if (error) console.error("Error fetching notifications:", error);
    return data || [];
  },

  addParentNotification: async (notification: { parent_id?: number, parent_identifier?: string, title: string, message: string, type?: string, player_id?: number }) => {
    const { data, error } = await supabase.from('parent_notifications').insert([notification]).select();
    if (error) {
      console.error("Failed to add notification:", error);
      throw error;
    }
    return data ? data[0] : null;
  },

  markNotificationAsRead: async (id: number) => {
    const { data, error } = await supabase.from('parent_notifications').update({ is_read: true }).eq('notification_id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteParentNotification: async (id: number) => {
    const { error } = await supabase.from('parent_notifications').delete().eq('notification_id', id);
    if (error) throw error;
    return true;
  },

  // Alias for sendWhatsAppMessage (Already handled by async version above)

  getPlayerParentCredentials: async (playerId: number) => {
    const { data, error } = await supabase.from('players').select('parent_username, parent_password, phone').eq('player_id', playerId).single();
    if (error) throw error;
    return data;
  },

  getAllData: async () => {
    try {
      const tables = [
        'academy_settings', 'categories', 'subscription_plans', 'coaches',
        'teams', 'players', 'training', 'attendance', 'ems_matches',
        'ems_match_players', 'ems_match_events', 'stock_entries', 'stock_outputs',
        'player_stats', 'subscriptions', 'payments', 'injuries', 'evaluations',
        'finances', 'kits', 'parents', 'parent_players', 'parent_notifications'
      ];

      const results = await Promise.all(
        tables.map(table => supabase.from(table).select('*'))
      );

      const allData: any = {};
      tables.forEach((table, index) => {
        allData[table] = results[index].data || [];
      });

      return allData;
    } catch (error) {
      console.error("Failed to get all data:", error);
      throw error;
    }
  },

  restoreData: async (table: string, rows: any[]) => {
    const { error } = await supabase.from(table).insert(rows);
    if (error) throw error;
    return true;
  },

  clearTable: async (table: string) => {
    // Attempt standard delete with a non-matching condition
    // In Supabase, delete() requires a filter to prevent accidental deletion of everything
    // unless you use a filter that matches all rows.

    // List of common primary keys in the system
    const keys = ['id', 'player_id', 'payment_id', 'training_id', 'coach_id', 'team_id', 'stat_id', 'evaluation_id', 'finance_id', 'plan_id', 'entry_id', 'output_id', 'injury_id', 'notification_id', 'category_id'];

    for (const key of keys) {
      try {
        // Try deleting rows where the key is NOT equal to -1 (matches all positive IDs)
        // OR where the key is NOT null (matches everything else)
        const { error } = await supabase.from(table).delete().not(key, 'is', null);

        if (!error) return true;

        // If error is about missing column, continue to next key
        if (error.code === '42703') continue;

        throw error;
      } catch (e) {
        // Continue if it's a "column not found" error
        continue;
      }
    }

    // Ultimate fallback: Try a very generic filter
    const { error: finalError } = await supabase.from(table).delete().neq('created_at', '1970-01-01');
    if (finalError && finalError.code !== '42703') throw finalError;

    return true;
  },

  getOverduePlayers: async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('players')
        .select('*')
        .lt('subscription_end', today)
        .eq('status', 'active');
    if (error) throw error;
    return data || [];
  },

  checkAndSendPaymentReminders: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get overdue players
    const overdue = await api.getOverduePlayers();
    if (overdue.length === 0) return 0;

    let sent = 0;
    for (const p of overdue) {
        // Only send if no reminder was sent in the last 7 days to avoid spam
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const { count } = await supabase
            .from('parent_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', p.player_id)
            .eq('type', 'تنبيه_دفع')
            .gte('created_at', sevenDaysAgoStr);

        if (!count || count === 0) {
            await api.addParentNotification({
                parent_id: p.parent_id,
                parent_identifier: p.parent_username,
                title: 'تذكير: دفع الاشتراك ⚠️',
                message: `نحيطكم علماً بأن اشتراك اللاعب (${p.name}) قد انتهى بتاريخ ${p.subscription_end}. يرجى تسوية الوضعية عبر بريدي موب لتفادي توقف النشاط.`,
                player_id: p.player_id,
                type: 'تنبيه_دفع'
            });
            sent++;
        }
    }
    return sent;
  },

  // --- Coach Payroll ---
  getCoachPayments: async (month?: string) => {
    let query = supabase.from('coach_payments').select('*, coaches(name)');
    if (month) query = query.eq('month', month);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  addCoachPayment: async (payment: any) => {
    const { data, error } = await supabase.from('coach_payments').insert([payment]).select();
    if (error) throw error;
    
    // Also record it as an expense in finances
    await api.addFinance({
      type: 'expense',
      category: 'أجور المدربين',
      amount: payment.amount,
      date: payment.payment_date || new Date().toISOString().split('T')[0],
      notes: `أجر المدرب ${payment.coach_name || ''} لشهر ${payment.month} (${payment.sessions_count} حصة)`
    }).catch(console.error);

    return data ? data[0] : null;
  },

  updateCoachSalary: async (coachId: number, salary: number) => {
    const { error } = await supabase.from('coaches').update({ salary_per_session: salary }).eq('coach_id', coachId);
    if (error) throw error;
    return true;
  },

  // --- Tournament Builder ---
  getTournaments: async () => {
    const { data, error } = await supabase.from('ems_tournaments').select('*').order('created_at', { ascending: false });
    if (error) console.error("getTournaments error:", error);
    return data || [];
  },
  
  addTournament: async (t: any) => {
    const { data, error } = await supabase.from('ems_tournaments').insert([t]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteTournament: async (id: number) => {
    const { error } = await supabase.from('ems_tournaments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  getTournamentTeams: async (tournamentId: number) => {
    const { data, error } = await supabase.from('ems_tournament_teams').select('*').eq('tournament_id', tournamentId);
    if (error) console.error("getTournamentTeams error:", error);
    return data || [];
  },

  addTournamentTeam: async (tt: any) => {
    const { data, error } = await supabase.from('ems_tournament_teams').insert([tt]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getTournamentMatches: async (tournamentId: number) => {
    const { data, error } = await supabase.from('ems_tournament_matches').select('*').eq('tournament_id', tournamentId).order('match_date', { ascending: true });
    if (error) console.error("getTournamentMatches error:", error);
    return data || [];
  },

  addTournamentMatch: async (m: any) => {
    const { data, error } = await supabase.from('ems_tournament_matches').insert([m]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateTournamentMatch: async (id: number, m: any) => {
    const { data, error } = await supabase.from('ems_tournament_matches').update(m).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Kit Lifecycle ---
  getPlayerKitAssignments: async (playerId?: number) => {
    let query = supabase.from('ems_player_kit_assignments').select('*');
    if (playerId) query = query.eq('player_id', playerId);
    const { data, error } = await query.order('distributed_at', { ascending: false });
    if (error) console.error("getPlayerKitAssignments error:", error);
    return data || [];
  },

  addPlayerKitAssignment: async (a: any) => {
    const { data, error } = await supabase.from('ems_player_kit_assignments').insert([a]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updatePlayerKitAssignment: async (id: number, a: any) => {
    const { data, error } = await supabase.from('ems_player_kit_assignments').update(a).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deletePlayerKitAssignment: async (id: number) => {
    const { error } = await supabase.from('ems_player_kit_assignments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // --- Tournament Pro (Independent) ---
  getTGTeams: async () => {
    const { data, error } = await supabase.from('tg_teams').select('*').order('name');
    if (error) console.error("getTGTeams error:", error);
    return data || [];
  },

  addTGTeam: async (t: any) => {
    const { data, error } = await supabase.from('tg_teams').insert([t]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getTGGroups: async () => {
    const { data, error } = await supabase.from('tg_groups').select('*').order('name');
    if (error) console.error("getTGGroups error:", error);
    return data || [];
  },

  addTGGroup: async (g: any) => {
    const { data, error } = await supabase.from('tg_groups').insert([g]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getTGGroupTeams: async () => {
    const { data, error } = await supabase.from('tg_group_teams').select('*');
    if (error) console.error("getTGGroupTeams error:", error);
    return data || [];
  },

  addTGGroupTeam: async (gt: any) => {
    const { data, error } = await supabase.from('tg_group_teams').insert([gt]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getTGMatches: async () => {
    const { data, error } = await supabase.from('tg_matches').select('*').order('match_date').order('match_time');
    if (error) console.error("getTGMatches error:", error);
    return data || [];
  },

  addTGMatchesBulk: async (mArray: any[]) => {
    const { data, error } = await supabase.from('tg_matches').insert(mArray).select();
    if (error) throw error;
    return data || [];
  },

  updateTGMatch: async (id: number, m: any) => {
    const { data, error } = await supabase.from('tg_matches').update(m).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  deleteTGMatch: async (id: number) => {
    const { error } = await supabase.from('tg_matches').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  updateTGTeam: async (id: number, t: any) => {
    const { data, error } = await supabase.from('tg_teams').update(t).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  updateTGGroup: async (id: number, g: any) => {
    const { data, error } = await supabase.from('tg_groups').update(g).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  deleteTGTeam: async (id: number) => {
    const { error } = await supabase.from('tg_teams').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  deleteTGGroup: async (id: number) => {
    const { error } = await supabase.from('tg_groups').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  resetTournamentPro: async () => {
    // Delete in order due to constraints
    await supabase.from('tg_matches').delete().neq('id', 0);
    await supabase.from('tg_group_teams').delete().neq('id', 0);
    await supabase.from('tg_groups').delete().neq('id', 0);
    await supabase.from('tg_teams').delete().neq('id', 0);
    return true;
  },

  // --- Admins ---
  getAdmins: async () => {
    const { data, error } = await supabase.from('admins').select('*');
    if (error) { console.warn("Failed to fetch admins:", error); return []; }
    return data;
  },
  addAdmin: async (admin: any) => {
    const { data, error } = await supabase.from('admins').insert([admin]).select();
    if (error) throw error;
    return data;
  },
  updateAdmin: async (id: number, admin: any) => {
    const { data, error } = await supabase.from('admins').update(admin).eq('id', id).select();
    if (error) throw error;
    return data;
  },
  deleteAdmin: async (id: number) => {
    const { data, error } = await supabase.from('admins').delete().eq('id', id).select();
    if (error) throw error;
    return data;
  },

  // --- Pedagogical Reports ---
  getPedagogicalReports: async (playerId?: number) => {
    let query = supabase.from('evaluations').select(`
      *,
      coaches(name)
    `).order('date', { ascending: false });
    
    if (playerId) query = query.eq('player_id', playerId);
    
    const { data, error } = await query;
    if (error) throw error;
    // Map the fields for compatibility with the new UI if needed
    return (data || []).map(r => ({
      ...r,
      technical_level: r.technical,
      tactical_level: r.tactical,
      physical_level: r.physical,
      discipline_level: r.mental,
      created_at: r.date
    }));
  },

  createPedagogicalReport: async (report: any) => {
    const payload = {
      player_id: report.player_id,
      coach_id: report.coach_id,
      date: new Date().toISOString().split('T')[0],
      technical: Math.round(report.technical_level || 5),
      tactical: Math.round(report.tactical_level || 5),
      physical: Math.round(report.physical_level || 5),
      mental: Math.round(report.discipline_level || 5),
      notes: report.notes,
      // Use provided FIFA-style stats or calculate from levels
      pace: Math.round(report.pace ?? ((report.physical_level || 5) * 10)),
      shooting: Math.round(report.shooting ?? ((report.technical_level || 5) * 10)),
      passing: Math.round(report.passing ?? ((report.technical_level || 5) * 10)),
      dribbling: Math.round(report.dribbling ?? ((report.technical_level || 5) * 10)),
      defending: Math.round(report.defending ?? ((report.tactical_level || 5) * 10)),
      physical_status: Math.round(report.physical ?? ((report.physical_level || 5) * 10))
    };

    // Try full insert first
    const { data, error } = await supabase.from('evaluations').insert([payload]).select();
    
    if (error) {
      console.warn("Full evaluation save failed, trying basic save...", error.message);
      // Fallback: Try saving only standard columns if the table hasn't been updated with FIFA stats yet
      const basicPayload = {
        player_id: report.player_id,
        coach_id: report.coach_id,
        date: new Date().toISOString().split('T')[0],
        technical: Math.round(report.technical_level || 5),
        tactical: Math.round(report.tactical_level || 5),
        physical: Math.round(report.physical_level || 5),
        mental: Math.round(report.discipline_level || 5),
        notes: report.notes
      };
      const { data: basicData, error: basicError } = await supabase.from('evaluations').insert([basicPayload]).select();
      if (basicError) throw basicError;
      return basicData ? basicData[0] : null;
    }
    
    return data ? data[0] : null;
  },

  // --- Events & RSVPs ---
  getEvents: async (category?: string) => {
    let query = supabase.from('events').select('*').order('start_time', { ascending: true });
    // Using contains for text array target_categories
    if (category) query = query.contains('target_categories', [category]);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  createEvent: async (event: any) => {
    const { data, error } = await supabase.from('events').insert([event]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  getEventResponses: async (eventId: string) => {
    const { data, error } = await supabase.from('event_responses').select(`
      *,
      player:player_id(name, category)
    `).eq('event_id', eventId);
    if (error) throw error;
    return data || [];
  },

  upsertEventResponse: async (response: any) => {
    const { data, error } = await supabase.from('event_responses').upsert([response]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },

  // --- Matches & Lineups ---
  getMatchDetails: async (eventId: string) => {
    const { data, error } = await supabase.from('match_details').select('*').eq('event_id', eventId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  upsertMatchDetails: async (details: any) => {
    const { data, error } = await supabase.from('match_details').upsert([details]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },


  // --- Expense Invoices ---
  getExpenseInvoices: async () => {
    const { data, error } = await supabase
      .from('expense_invoices')
      .select('*, items:expense_invoice_items(*)')
      .order('invoice_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addExpenseInvoice: async (invoice: any, items: any[]) => {
    const { data: inv, error: invErr } = await supabase
      .from('expense_invoices')
      .insert([invoice])
      .select()
      .single();
    if (invErr) throw invErr;
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({ ...item, invoice_id: inv.id }));
      const { error: itemsErr } = await supabase.from('expense_invoice_items').insert(itemsWithInvoiceId);
      if (itemsErr) throw itemsErr;
    }
    return inv;
  },
  updateExpenseInvoice: async (invoiceId: number, invoice: any, items: any[]) => {
    const { error: invErr } = await supabase.from('expense_invoices').update(invoice).eq('id', invoiceId);
    if (invErr) throw invErr;
    // Delete old items and re-insert
    await supabase.from('expense_invoice_items').delete().eq('invoice_id', invoiceId);
    if (items.length > 0) {
      const itemsWithInvoiceId = items.map(item => ({ ...item, invoice_id: invoiceId }));
      const { error: itemsErr } = await supabase.from('expense_invoice_items').insert(itemsWithInvoiceId);
      if (itemsErr) throw itemsErr;
    }
  },
  deleteExpenseInvoice: async (invoiceId: number) => {
    await supabase.from('expense_invoice_items').delete().eq('invoice_id', invoiceId);
    const { error } = await supabase.from('expense_invoices').delete().eq('id', invoiceId);
    if (error) throw error;
  },
};
