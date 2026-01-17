const nodemailer = require('nodemailer');

/**
 * Helper Function to Send Mail.
 */
exports.sendMail = (settings) => {
  const transportConfig = {
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  let transporter = nodemailer.createTransport(transportConfig);

  return transporter.sendMail(settings.mailOptions);
};
