const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { formData } = req.body || {};

  if (!formData) {
    return res.status(400).json({ message: "Aucune donnée reçue" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Simulateur Lumigency" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: "🎯 Nouveau prospect – Simulateur Lumigency",
      html: `
        <h2>Nouvelle soumission du simulateur</h2>
        <p><strong>Données reçues :</strong></p>
        <pre style="font-size:14px; padding:12px; background:#f6f6f6; border-radius:6px;">${JSON.stringify(formData, null, 2)}</pre>
      `,
    });

    res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur lors de l'envoi du mail :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.toString() });
  }
};
