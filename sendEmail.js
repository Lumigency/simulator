const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const formData = req.body || {};

  if (!formData) {
    return res.status(400).json({ message: "Aucune donnée reçue" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.gmail.com",
      port: 587,
      secure: false, // TLS auto
      tls: {
        rejectUnauthorized: false,
      }
      // ATTENTION : PAS D'AUTH → c'est ton SMTP relay qui authentifie par IP.
    });

    await transporter.sendMail({
      from: `"Simulateur Lumigency" <tiphaine@lumigency.com>`,
      to: "tiphaine@lumigency.com",
      subject: "🆕 Nouveau prospect – Simulateur Lumigency",
      html: `
        <h2>Nouvelle soumission du simulateur</h2>
        <p><strong>Données reçues :</strong></p>
        <pre style="font-size:14px; padding:12px; background:#f6f6f6; border-radius:6px;">
${JSON.stringify(formData, null, 2)}
        </pre>
      `,
    });

    res.status(200).json({ message: "Email envoyé avec succès" });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
