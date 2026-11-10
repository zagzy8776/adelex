# ADEXEC Logistics

A shipping website with customer tracking, a dispatch dashboard, and optional driver GPS. The application supports Vercel Next.js and the existing Sites Worker. Both use Neon PostgreSQL storage. The supplied ADEXEC logo is used throughout. The homepage cargo photograph comes from [Unsplash](https://images.unsplash.com/photo-1585713181935-d5f622cc2415).

## Dispatch workflow

1. On Vercel, open /admin and enter the private administrator access key. On the existing Sites host, open /admin and sign in with the designated ChatGPT account. Select **Activate admin dashboard** on the first visit. The server matches the verified email to the private ADMIN_OWNER_EMAIL setting, then binds the administrator role to the account’s stable site user ID.
2. Open **Business settings** to publish your contact details. Review customer quote requests under **Shipping requests**.
3. Create a shipment. Enter the recipient, cargo, cities, and estimated delivery. Select pickup and destination coordinates on the map or enter them directly.
4. In **Manage shipment**, use **Edit booking details** to change recipient information, service, cargo, route coordinates, weight, package count, and ETA. Review the customer view or the milestone history. Correct a milestone note directly, or publish a new position/status update. A replacement tracking number invalidates the old customer link.
5. Copy the customer tracking link or use **Prepare email** to compose a message in your mail app. Send it to the recipient. The recipient can also enter the code on /track.
6. Open the shipment to publish a status, customer note, new position, or revised delivery estimate. The tracker checks for updates every ten seconds while visible.
7. For GPS, generate a private driver link for that shipment. The driver must open it over HTTPS, allow location access, and keep the page active. The driver can stop sharing at any time. Dispatch can revoke the link. It expires after 48 hours and is disabled when delivery or cancellation is recorded.

The tracker labels manual reports and old GPS readings. Dashed lines connect reported coordinates and do not represent turn-by-turn directions. /track?code=ADX-DEMO is an illustrative sample. The international example runs from Rotterdam to Brussels. The replay is independent of real shipments.

## Development

Use Node.js 22.13 or newer and install the locked dependencies with `npm ci`. Configure a server-side `DATABASE_URL` for the Neon database and `ADMIN_OWNER_EMAIL` for the administrator. Supply runtime values using the hosting provider’s secret settings, or a local ignored `.dev.vars` file. Run `npm run db:migrate` with DATABASE_URL set in the shell to apply the PostgreSQL migrations. The application uses the dedicated adexec schema. Run `npm run dev` for development and `npm run build` for a production compilation.

## Hosting and identity

Sites supplies verified identity headers through its sign-in gateway. A separate host needs its own trusted authentication gateway that strips client-supplied identity headers before setting verified identity. For portable preview with the starter’s simulated login, use seedy@sites.test as the local owner email and a separate development database.

The published website’s access setting controls who can visit. Public access allows customers to track with their code and drivers to share with their private link. Administrators must sign in and pass the server-side owner check. No AI Gateway, Realtime, or Neon Auth credentials are needed for this configuration.

Customer links are bearer references. Public tracking excludes recipient names, email, phone numbers, and driver credentials. Driver links store their secret in the URL fragment and the database stores its hash. Shipment details and milestones are written together. GPS updates reject expired or revoked links, old coordinates, and low-accuracy readings.


## Vercel

Import the repository into the intended Vercel team. Select Next.js and the repository root. The committed vercel.json selects the native Next.js build. Set the following private Production variables before deploying. Use a separate Neon database and different key for Preview deployments.

| Variable | Value |
| --- | --- |
| DATABASE_URL | Pooled Neon PostgreSQL connection string with TLS. Apply the committed migrations to a new database using npm run db:migrate. |
| ADMIN_OWNER_EMAIL | Business email for the dispatch administrator. |
| ADMIN_ACCESS_KEY | Unique random private key of at least 32 characters. Generate locally with openssl rand -hex 32. The administrator enters this key at /admin/login. Rotating it invalidates previously issued sessions after redeployment. |

Use npm run build:vercel for a local production compilation. Vercel customers can open /track without signing in when the production deployment is publicly accessible. A customer needs the complete reference for one shipment. Anyone holding that reference can view the same shipment. The public API returns an explicit list of shipment fields and excludes contact details, database shipment IDs and driver credentials. The tracker checks every ten seconds while the page is visible. New references contain 100 random bits grouped into four blocks. Previously issued references remain valid.

## Location data

The dispatch forms support country/territory, region and city selection plus an optional county or district. A selected city supplies approximate coordinates. Dispatch can enter an unlisted location and use the map for the precise depot or delivery position. The directory is sourced from GeoNames under CC BY 4.0; see public/places/ATTRIBUTION.txt. Regenerate it with python3 scripts/update-places.py.

## Customer email

A new shipping request queues a receipt for the requester. Booking, published milestones, delivery, exceptions, corrected notes, ETA edits, replacement references, and recipient changes queue emails for the shipment recipient. Tracking links use https://adexeclogistics.org. Map GPS samples do not generate email.

In Resend, verify the domain (or sending subdomain) you want in the From address by adding the DNS records Resend supplies. Keep existing website and mailbox DNS records. In the **production Vercel project serving your domain**, set RESEND_API_KEY (sending-only key), EMAIL_FROM (e.g. ADEXEC Logistics <tracking@adexeclogistics.org> after that domain is verified), and optionally EMAIL_REPLY_TO (a monitored business mailbox). Configure CRON_SECRET as a separate random secret for scheduled retries. Redeploy after adding environment variables. Website domain validation and email sender verification are independent. This integration sends transactional email; it does not create a receiving mailbox.

The production build applies pending PostgreSQL migrations when DATABASE_URL is set. Database triggers enqueue notifications within the same transaction as the booking, request or milestone. The application attempts immediate sending after a successful write. **Business settings → Customer emails** shows pending, provider-accepted, failed, superseded, or expired messages and lets dispatch retry. Accepted does not confirm inbox delivery. Provider errors cannot undo a saved shipment. The daily Vercel Cron and manual processing handle retries; the original job key is reused within the provider idempotency window. Messages older than 23 hours expire rather than emailing stale information. No past shipments are emailed by the migration. Supply a recipient email to enable booking and tracking notices for a shipment.
