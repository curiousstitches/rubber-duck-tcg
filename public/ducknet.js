// 🌐 DUCKNET — live player-vs-player over Supabase Realtime
(function(){
    const N = { sb:null, me:null, match:null, chan:null, side:null,
                             onMatch:null, onMove:null, onEnd:null, searching:false };

    N.ready = function(){
          if(N.sb) return true;
          if(typeof supabase==='undefined' || typeof SUPABASE_URL==='undefined'
                    || !SUPABASE_URL || SUPABASE_URL.indexOf('PASTE')!==-1) return false;
          N.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          return true;
    };

    N.signedIn = async function(){
          if(!N.ready()) return false;
          const { data } = await N.sb.auth.getSession();
          N.me = data.session ? data.session.user : null;
          return !!N.me;
    };

    // join the queue, or get paired immediately
    N.find = async function(power, handle, deck){
          if(!await N.signedIn()) return {error:'sign in first'};
          N.searching = true;
          const { data, error } = await N.sb.rpc('find_match',
                                                 { my_power: power|0, my_handle: handle||'duck', my_deck: deck||[] });
          if(error) return {error: error.message};
          if(data){ await N.join(data); return {matched:true, id:data}; }
          N.waitForPair();
          return {waiting:true};
    };

    // sit in the queue until somebody pairs with us
    N.waitForPair = function(){
          N.qchan = N.sb.channel('q-'+N.me.id)
                  .on('postgres_changes',
                      {event:'UPDATE', schema:'public', table:'match_queue',
                                filter:'player_id=eq.'+N.me.id},
                              async p=>{
                                          if(p.new && p.new.matched_id){
                                                        await N.sb.from('match_queue').delete().eq('player_id', N.me.id);
                                                        N.qchan.unsubscribe();
                                                        await N.join(p.new.matched_id);
                                          }
                              })
                  .subscribe();
    };

    N.cancel = async function(){
          N.searching = false;
          if(N.qchan) { try{ N.qchan.unsubscribe(); }catch(e){} }
          if(N.me) await N.sb.from('match_queue').delete().eq('player_id', N.me.id);
    };

    N.join = async function(id){
          N.searching = false;
          const { data } = await N.sb.from('live_matches').select('*').eq('id', id).maybeSingle();
          if(!data) return;
          N.match = data;
          N.side = (data.p1 === N.me.id) ? 'p1' : 'p2';
          N.chan = N.sb.channel('m-'+id)
                  .on('postgres_changes',
                      {event:'INSERT', schema:'public', table:'match_moves', filter:'match_id=eq.'+id},
                              p=>{ if(N.onMove) N.onMove(p.new); })
                  .on('postgres_changes',
                      {event:'UPDATE', schema:'public', table:'live_matches', filter:'id=eq.'+id},
                              p=>{ N.match = p.new;
                                               if(p.new.state==='done' && N.onEnd) N.onEnd(p.new); })
                  .subscribe();
          if(N.onMatch) N.onMatch(data, N.side);
    };

    N.move = async function(turn, card, stance, roll){
          if(!N.match) return;
          await N.sb.from('match_moves').insert({
                  match_id: N.match.id, player_id: N.me.id,
                  turn: turn, card: card, stance: stance, roll: roll
          });
    };

    N.movesFor = async function(turn){
          if(!N.match) return [];
          const { data } = await N.sb.from('match_moves')
                  .select('*').eq('match_id', N.match.id).eq('turn', turn);
          return data||[];
    };

    N.setHp = async function(p1hp, p2hp, turn){
          if(!N.match) return;
          await N.sb.from('live_matches')
                  .update({p1_hp:p1hp, p2_hp:p2hp, turn:turn, updated_at:new Date().toISOString()})
                  .eq('id', N.match.id);
    };

    N.finish = async function(winnerId){
          if(!N.match) return;
          await N.sb.from('live_matches')
                  .update({state:'done', winner:winnerId}).eq('id', N.match.id);
          if(N.chan) { try{ N.chan.unsubscribe(); }catch(e){} }
          N.match = null;
    };

    N.leave = async function(){
          await N.cancel();
          if(N.chan) { try{ N.chan.unsubscribe(); }catch(e){} }
          N.match = null;
    };

    window.DuckNet = N;
})();
