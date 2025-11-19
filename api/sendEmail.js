const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const formData = req.body || {};

  try {
    // Transport Gmail via mot de passe d’application
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,        // smtp.gmail.com
      port: process.env.MAIL_PORT,        // 465
      secure: true,                       // SSL
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    // Template HTML stylisé
    function emailHTML(data) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; padding: 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color:#0000FF;">🔔 Nouveau prospect – Simulateur Lumigency</h2>

          <h3 style="color:#0000FF;">🎯 Objectif & Maturité</h3>
          <div style="background:#f4f7ff; padding:12px; border-radius:6px;">
            <p><strong>Objectif :</strong> ${data.objectif}</p>
            <p><strong>Hybrides :</strong> ${data.hybrides}</p>
            <p><strong>Message :</strong><br>${data.messageMaturite}</p>
          </div>

          <h3 style="color:#0000FF;">🏢 Caractéristiques business</h3>
          <div style="background:#f6f6f6; padding:12px; border-radius:6px;">
            <p><strong>Secteur :</strong> ${data.sectorLabel}</p>
            <p><strong>Site :</strong> ${data.site}</p>
            <p><strong>Email prospect :</strong> ${data.emailProspect}</p>
            <p><strong>Marge :</strong> ${data.marge}</p>
          </div>

          <h3 style="color:#0000FF;">📥 Inputs du simulateur</h3>
          <div style="background:#fff7f7; padding:12px; border-radius:6px;">
            <p><strong>Trafic mensuel :</strong> ${data.trafficMensuel}</p>
            <p><strong>Budget mensuel :</strong> ${data.budgetMensuel}</p>
            <p><strong>Budget annuel :</strong> ${data.budgetAnnuel}</p>
            <p><strong>AOV saisi :</strong> ${data.aovSaisi}</p>
            <p><strong>CVR saisi :</strong> ${data.cvrSaisi}</p>
            <p><strong>CAC client :</strong> ${data.cacClient}</p>
            <p><strong>Leviers :</strong> ${data.leviersSelectionnes}</p>
          </div>

          <h3 style="color:#0000FF;">📊 Résultats</h3>
          <div style="background:#f3fff4; padding:12px; border-radius:6px;">
            <p><strong>Commandes finales :</strong> ${data.commandesFinales}</p>
            <p><strong>CA :</strong> ${data.chiffreAffaires}</p>
            <p><strong>ROI :</strong> ${data.roi}</p>
          </div>

          <h3 style="color:#0000FF;">🗂 Données complètes</h3>
          <pre style="font-size:13px; padding:12px; background:#f6f6f6; border-radius:6px;">${JSON.stringify(data, null, 2)}</pre>

          <p style="text-align:center; margin-top:30px; font-size:13px; color:#666;">
            — Email envoyé automatiquement par le simulateur Lumigency 🚀 —
          </p>
        </div>
      `;
    }

    // Envoi de l’email
    await transporter.sendMail({
      from: `"Simulateur Lumigency" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: "🆕 Nouveau prospect – Simulateur Lumigency",
      html: emailHTML(formData)
    });

    return res.status(200).json({ message: "Email envoyé avec succès" });

  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};
