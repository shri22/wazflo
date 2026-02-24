using System.Security.Claims;

namespace Wazflo.Api.Helpers
{
    /// <summary>
    /// Helper to resolve the effective storeId for a request.
    /// Super Admins can pass X-Store-Id header to impersonate a store,
    /// or operate platform-wide (storeId = null).
    /// </summary>
    public static class StoreContext
    {
        /// <summary>
        /// Returns (storeId, isSuperAdmin).
        /// For super admins: storeId may be null (platform-wide) or set via X-Store-Id header.
        /// For store admins: storeId is always set from JWT.
        /// Returns null storeId if super admin with no header (platform-wide access).
        /// Returns -1 storeId if the user is unauthorized (no valid claims).
        /// </summary>
        public static (int? storeId, bool isSuperAdmin, bool isUnauthorized) Resolve(
            ClaimsPrincipal user,
            IHeaderDictionary headers)
        {
            var isSuperAdmin = user.FindFirst("isSuperAdmin")?.Value == "true";
            var storeIdClaim = user.FindFirst("storeId")?.Value;

            if (isSuperAdmin)
            {
                // Super admin: check X-Store-Id header for impersonation
                if (headers.TryGetValue("X-Store-Id", out var headerStoreId) &&
                    int.TryParse(headerStoreId, out var hStoreId))
                {
                    return (hStoreId, true, false);
                }
                // No header = platform-wide access
                return (null, true, false);
            }

            // Regular store admin: must have storeId in JWT
            if (string.IsNullOrEmpty(storeIdClaim) || !int.TryParse(storeIdClaim, out var storeId))
            {
                return (null, false, true); // unauthorized
            }

            return (storeId, false, false);
        }
    }
}
