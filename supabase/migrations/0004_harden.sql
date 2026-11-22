-- =====================================================================
-- Endurecimento de segurança (avisos do linter):
-- 1) search_path fixo em touch_updated_at
-- 2) funções SECURITY DEFINER não devem ser chamáveis por anon via RPC.
--    Mantemos EXECUTE apenas para authenticated (necessário para a RLS);
--    handle_new_user roda só via trigger, então revogamos de todos.
-- =====================================================================

alter function public.touch_updated_at() set search_path = public;

revoke execute on function public.is_admin()                 from public;
revoke execute on function public.can_see_processo(uuid)     from public;
revoke execute on function public.can_see_cliente(uuid)      from public;
revoke execute on function public.can_see_honorario(uuid)    from public;
revoke execute on function public.can_see_perfil(uuid)       from public;

grant execute on function public.is_admin()                  to authenticated;
grant execute on function public.can_see_processo(uuid)      to authenticated;
grant execute on function public.can_see_cliente(uuid)       to authenticated;
grant execute on function public.can_see_honorario(uuid)     to authenticated;
grant execute on function public.can_see_perfil(uuid)        to authenticated;

revoke execute on function public.handle_new_user()          from public;
