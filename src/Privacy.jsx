export default function Privacy() {
  return (
    <div className="page-wrap" style={{ maxWidth: 700 }}>
      <div className="form-card">
        <h2>Privacy Policy</h2>
        <p className="sub">Last updated: {new Date().toLocaleDateString()}</p>
        <div style={{ fontSize: 14, lineHeight: 1.7 }}>
          <p><strong>What we collect.</strong> Your email, name, phone number (optional), profile photo, and any property photos/videos you upload. If you submit a listing, we also collect its location, price, and description.</p>
          <p><strong>Messages.</strong> Messages sent between students and agents about a listing are stored so both parties can see conversation history. We don't read messages except to investigate reports of abuse.</p>
          <p><strong>How it's used.</strong> Your information is used to operate the platform, verify listings, and let students and agents communicate. We don't sell your data to third parties.</p>
          <p><strong>Storage.</strong> Data is stored securely with Supabase. Photos and videos are kept in access-controlled storage, not publicly listed unless attached to an approved listing.</p>
          <p><strong>Your choices.</strong> You can edit or delete your profile information, and delete your own listings at any time from the app.</p>
          <p><strong>Contact.</strong> Questions about your data can be raised through the platform's messaging or the contact provided in the app.</p>
        </div>
      </div>
    </div>
  )
}
