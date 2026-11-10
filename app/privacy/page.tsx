import { Header, Footer } from "@/app/components/Shell";
export default function Privacy() {
  return (
    <>
      <Header />
      <div className="page-intro">
        <div className="wrap">
          <span className="eyebrow light">YOUR INFORMATION</span>
          <h1>Privacy, in plain language.</h1>
        </div>
      </div>
      <main className="legal-content">
        <p>
          This page explains how information is used by the ADEXEC Logistics
          website.
        </p>
        <h2>Shipping and contact details</h2>
        <p>
          When you request a quote, we collect your name, email, phone number,
          route, and cargo information to review your request and contact you.
          Shipment records may also contain recipient contact details entered by
          the operations team.
        </p>
        <h2>Shipment emails</h2>
        <p>
          When sending is enabled, ADEXEC sends request receipts to the
          requester and shipment notifications to the recipient email recorded
          by dispatch. Our email service processes the recipient address and
          message to deliver these operational updates. GPS readings are shown
          on the tracking page.
        </p>
        <h2>Tracking information</h2>
        <p>
          Anyone with the complete tracking number can access that shipment’s
          status, cargo description, general locations, and delivery estimate.
          Recipient names, phone numbers, and email addresses are not included
          in the public tracking response. Treat tracking links as private and
          share them only with people who need them.
        </p>
        <h2>Driver location sharing</h2>
        <p>
          Drivers can choose to share GPS location through a time-limited link.
          Sharing starts only after the driver presses the start button and
          grants location permission. The latest coordinates are stored to
          update the shipment map. Stop sharing at any time. Driver links expire
          and can be revoked by dispatch.
        </p>
        <h2>Maps and account access</h2>
        <p>
          The map loads tiles from OpenStreetMap, whose servers receive normal
          browser requests, including your IP address. Only dispatch staff can
          access the admin dashboard. Customers do not need an account to track
          a shipment.
        </p>
        <h2>Questions and deletion requests</h2>
        <p>
          Contact ADEXEC through the shipping request form or the contact
          details published in the footer to ask about your information or
          request correction or deletion. Include your shipment or request
          reference so the team can locate the relevant record.
        </p>
      </main>
      <Footer />
    </>
  );
}
