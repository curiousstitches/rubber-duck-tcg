// ============================================================
//  ☁️  DUCKSAVE — keeps a player's collection, coins, decks and
//  progress in Supabase. Falls back to this-device-only storage
//  when signed out or offline, and merges up on first sign-in.
// ============================================================
(function () {
    const LOCAL = 'duck_tcg_save_v1';
    const QUEUE = 'duck_tcg_pending';

    const DS = {
          sb: null,
          user: null,
          ready: false,
          online: false,
          _saveTimer: null,
          onChange: null,      // set by the game to react to sign-in/out
    };

    /* ---------------- local storage helpers ---------------- */
    function localRead() {
          try { return JSON.parse(localStorage.getItem(LOCAL)) || null; }
          catch (e) { return null; }
    }
    function localWrite(state) {
          try { localStorage.setItem(LOCAL, JSON.stringify(state)); } catch (e) {}
    }
    function markPending() {
          try { localStorage.setItem(QUEUE, '1'); } catch (e) {}
    }
    function clearPending() {
          try { localStorage.removeItem(QUEUE); } catch (e) {}
    }
    function hasPending() {
          try { return localStorage.getItem(QUEUE) === '1'; } catch (e) { return false; }
    }

    /* ---------------- boot ---------------- */
    DS.init = async function () {
          if (typeof SUPABASE_URL === 'undefined' || !SUPABASE_URL ||
                      SUPABASE_URL.indexOf('PASTE') !== -1 || typeof supabase === 'undefined') {
                  DS.ready = true;
                  DS.online = false;
                  return { mode: 'local', reason: 'not configured' };
          }
          try {
                  // shared client (see supabase-config.js) — keeps "Remember me"
                  // consistent between the login screen and the live game.
                  DS.sb = (typeof getDuckClient==='function') ? getDuckClient() : null;
                  if (!DS.sb) { DS.ready = true; DS.online = false; return { mode: 'local', reason: 'not configured' }; }
                  const { data } = await DS.sb.auth.getSession();
                  DS.user = data.session ? data.session.user : null;
                  DS.online = !!DS.user;
                  DS.ready = true;

                  DS.sb.auth.onAuthStateChange(function (_evt, session) {
                            DS.user = session ? session.user : null;
                            DS.online = !!DS.user;
                            if (DS.onChange) DS.onChange(DS.user);
                  });

                  return { mode: DS.online ? 'cloud' : 'local', user: DS.user };
          } catch (e) {
                  DS.ready = true;
                  DS.online = false;
                  return { mode: 'local', reason: e.message };
          }
    };

    DS.signOut = async function () {
          if (DS.sb) await DS.sb.auth.signOut();
          DS.user = null;
          DS.online = false;
    };

    DS.who = function () {
          if (!DS.user) return null;
          return DS.user.user_metadata?.full_name ||
                       DS.user.email?.split('@')[0] || 'player';
    };

    /* ---------------- loading ---------------- */
    DS.load = async function () {
          const local = localRead();
          if (!DS.online) return local;

          try {
                  const uid = DS.user.id;
                  const [pRes, cRes, iRes, dRes] = await Promise.all([
                            DS.sb.from('players').select('*').eq('id', uid).maybeSingle(),
                            DS.sb.from('collection').select('card_name,card_kind,qty').eq('player_id', uid),
                            DS.sb.from('inventory').select('item_key,qty').eq('player_id', uid),
                            DS.sb.from('decks').select('id,name,cards,is_active').eq('player_id', uid),
                          ]);

                  const p = pRes.data;
                  // brand new account and this device has progress? push it up.
                  if (local && (!p || (!cRes.data || cRes.data.length === 0))) {
                            await DS.save(local, true);
                            return local;
                  }
                  if (!p) return local;

                  const owned = {}, items = {};
                  (cRes.data || []).forEach(r => {
                            if (r.card_kind === 'item') items[r.card_name] = r.qty;
                            else owned[r.card_name] = r.qty;
                  });
                  const inv = {};
                  (iRes.data || []).forEach(r => { inv[r.item_key] = r.qty; });

                  const state = {
                            coins: p.coins, packs: p.packs, level: p.level, xp: p.xp,
                            wins: p.wins, losses: p.losses, tier: p.career_tier, shards: p.shards||0, pity: p.pity ?? 0, streak: p.streak_days||0, lastLogin: p.last_login||"", achievements: p.achievements||{}, ach: p.achievements||{},
                            owned: owned, itemsOwned: items, inventory: inv,
                            decks: dRes.data || [],
                            starterGranted: !!p.starter_granted, founderBonusClaimed: !!p.founder_bonus_claimed,
                            signupNumber: p.signup_number || null,
                  };
                  localWrite(state);
                  clearPending();
                  return state;
          } catch (e) {
                  console.warn('cloud load failed, using this device:', e.message);
                  return local;
          }
    };

    /* ---------------- saving ---------------- */
    DS.save = async function (state, immediate) {
          localWrite(state);                       // always keep a local copy
          if (!DS.online) return { mode: 'local' };

          if (!immediate) {                        // debounce chatty callers
                  clearTimeout(DS._saveTimer);
                  return new Promise(res => {
                            DS._saveTimer = setTimeout(() => res(DS.save(state, true)), 1200);
                  });
          }
          clearTimeout(DS._saveTimer);              // an immediate save always wins -- never let an older, stale debounced save fire later and overwrite this

          let signupNumber = null, founderBonusClaimed = !!state.founderBonusClaimed;
          try {
                  const uid = DS.user.id;
                  // Note: signup_number is deliberately never included here — its DB
                  // DEFAULT (a sequence) only fires on the row's first INSERT, and
                  // omitting it from every upsert keeps that number permanent.
                  const { data: prow } = await DS.sb.from('players').upsert({
                            id: uid,
                            coins: state.coins | 0,
                            packs: state.packs | 0,
                            level: state.level | 0 || 1,
                            xp: state.xp | 0,
                            wins: state.wins | 0, shards: state.shards | 0, pity: state.pity ?? 0, streak_days: state.streak | 0, last_login: state.lastLogin || null, achievements: state.achievements || {},
                            losses: state.losses | 0,
                            career_tier: state.tier || 'bronze',
                            starter_granted: !!state.starterGranted,
                            founder_bonus_claimed: !!state.founderBonusClaimed,
                            updated_at: new Date().toISOString(),
                  }).select('signup_number, founder_bonus_claimed').maybeSingle();
                  if (prow) { signupNumber = prow.signup_number || null; founderBonusClaimed = !!prow.founder_bonus_claimed; }

                  const rows = [];
                  Object.keys(state.owned || {}).forEach(n => {
                            if (state.owned[n] > 0)
                                        rows.push({ player_id: uid, card_name: n, card_kind: 'duck', qty: state.owned[n] });
                  });
                  Object.keys(state.itemsOwned || {}).forEach(n => {
                            if (state.itemsOwned[n] > 0)
                                        rows.push({ player_id: uid, card_name: n, card_kind: 'item', qty: state.itemsOwned[n] });
                  });
                  if (rows.length) {
                            // chunked so a huge collection doesn't blow the request size
                            for (let i = 0; i < rows.length; i += 400) {
                                        await DS.sb.from('collection')
                                                      .upsert(rows.slice(i, i + 400), { onConflict: 'player_id,card_name,card_kind' });
                            }
                  }

                  const inv = Object.keys(state.inventory || {})
                            .filter(k => state.inventory[k] > 0)
                            .map(k => ({ player_id: uid, item_key: k, qty: state.inventory[k] }));
                  if (inv.length) {
                            await DS.sb.from('inventory').upsert(inv, { onConflict: 'player_id,item_key' });
                  }

                  clearPending();
                  return { mode: 'cloud', signupNumber: signupNumber, founderBonusClaimed: founderBonusClaimed };
          } catch (e) {
                  console.warn('cloud save failed, kept locally:', e.message);
                  markPending();
                  return { mode: 'local', error: e.message };
          }
    };

    /* record a finished battle */
    DS.logMatch = async function (mode, won, cardWon, cardLost) {
          if (!DS.online) return;
          try {
                  await DS.sb.from('matches').insert({
                            player_id: DS.user.id, mode: mode, won: !!won,
                            card_won: cardWon || null, card_lost: cardLost || null,
                  });
          } catch (e) {}
    };

    /* decks */
    DS.saveDeck = async function (name, cards, active) {
          if (!DS.online) return null;
          try {
                  const { data } = await DS.sb.from('decks').insert({
                            player_id: DS.user.id, name: name, cards: cards, is_active: !!active,
                  }).select().maybeSingle();
                  return data;
          } catch (e) { return null; }
    };

    /* anything waiting to go up? */
    DS.syncPending = async function (state) {
          if (DS.online && hasPending() && state) await DS.save(state, true);
    };

    window.DuckSave = DS;
})();
