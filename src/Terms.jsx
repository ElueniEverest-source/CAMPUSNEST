export default function Terms() {
  return (
    <div className="page-wrap" style={{ maxWidth: 700 }}>
      <div className="form-card">
        <h2>Terms of Service</h2>
        <p className="sub">Last updated: {new Date().toLocaleDateString()}</p>
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>
          <p>CampusNest is a marketplace connecting students with agents and landlords listing rooms, shops and other spaces across Delta State. By using CampusNest, you agree to the following:</p>
          <p><strong>1. Listings.</strong> All listings go through an admin review before appearing publicly. A "Verified" badge means the listing passed our review, it does not guarantee the accuracy of every detail provided by the agent, or the outcome of any tenancy arrangement.</p>
          <p><strong>2. User conduct.</strong> You agree not to submit false information, impersonate others, or use the messaging system to harass, scam, or mislead other users.</p>
          <p><strong>3. Transactions.</strong> CampusNest facilitates discovery and communication only. Any payment, agreement, or tenancy arranged between a student and an agent/landlord happens outside the platform, and CampusNest is not a party to that agreement.</p>
          <p><strong>4. Accounts.</strong> You're responsible for keeping your account credentials secure. Admins may suspend accounts that violate these terms.</p>
          <p><strong>5. Changes.</strong> These terms may be updated as the platform grows. Continued use after changes means you accept the updated terms.</p>
          <p>Questions about these terms can be sent through the app's messaging or to the contact provided on the platform.</p>
        </div>
      </div>
    </div>
  )
}
