## Summary

<!-- Brief description of what this PR changes and why -->

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Security fix (addresses a vulnerability)
- [ ] Refactor / cleanup (no functional change)
- [ ] Documentation
- [ ] Test addition / fix

## Checklist

- [ ] `npm run lint` passes locally
- [ ] `npm run test` passes locally
- [ ] `npm run build` passes locally
- [ ] I have added tests that prove my fix is effective or my feature works
- [ ] I have added/updated i18n keys in all 5 locales (en, ar, hi, ur, tl) if I added UI strings
- [ ] I have NOT committed secrets, service-role keys, or `.env.local`
- [ ] I have updated `DEPLOY.md` if I changed deployment-affecting config

## Security review (if applicable)

- [ ] No new RLS policy uses `USING (true)` or bypasses `auth.uid()`
- [ ] No new edge function uses `Access-Control-Allow-Origin: *`
- [ ] No new client-side code writes to protected columns (`role`, `ai_unlocked`, etc.)
- [ ] No new SQL function is `SECURITY DEFINER` without `SET search_path = public`

## Screenshots (if UI change)

<!-- Drag-and-drop screenshots here -->
