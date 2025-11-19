const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  try {
    // Transport Gmail via mot de passe d’application
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,        // smtp.gmail.com
      port: process.env.MAIL_PORT,        // 465
      secure: true,                       // SSL
      auth: {
        user: process.env.MAIL_USER,      // ton Gmail
        pass: process.env.MAIL_PASS       // mdp application
      }
    });

    // Envoi
    await transporter.sendMail({
      from: `"Simulateur Lumigency" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO,
      subject: "🆕 Nouveau prospect – Simulateur Lumigency",
      html: `
        <h2>Nouvelle soumission du simulateur</h2>
        <pre style="font-size:14px; padding:12px; background:#f6f6f6; border-radius:6px;">
${JSON.stringify(req.body, null, 2)}
        </pre>
      `
    });

    return res.status(200).json({ message: "Email envoyé avec succès" });

  } catch (error) {
    console.error("❌ Erreur envoi email:", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
};
