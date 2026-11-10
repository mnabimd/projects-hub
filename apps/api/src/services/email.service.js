const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const systemConfigService = require('./systemConfig.service');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((err) => logger.warn(`Unable to connect to email server: ${err.message}`));
}

/**
 * Get dynamic email sender
 * @returns {Promise<string>}
 */
const getSender = async () => {
  try {
    const systemConfig = await systemConfigService.getConfig();
    if (systemConfig && systemConfig.emailSender && systemConfig.emailSender.fromAddress) {
      return `"${systemConfig.emailSender.fromName || 'ProjectsHub'}" <${systemConfig.emailSender.fromAddress}>`;
    }
  } catch (err) {
    // fallback to static config
  }
  return config.email.from;
};

/**
 * Get dynamic client url
 * @returns {Promise<string>}
 */
const getClientUrl = async () => {
  try {
    const systemConfig = await systemConfigService.getConfig();
    if (systemConfig && systemConfig.clientUrl) {
      return systemConfig.clientUrl;
    }
  } catch (err) {
    // fallback to static config
  }
  return config.clientUrl;
};

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  const from = await getSender();
  const msg = { from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const clientUrl = await getClientUrl();
  const subject = 'Reset password';
  const resetPasswordUrl = `${clientUrl}/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} otp
 * @returns {Promise}
 *
 */

const sendVerificationEmail = async (to, token, otp) => {
  const clientUrl = await getClientUrl();
  const subject = 'Email Verification';
  const verificationEmailUrl = `${clientUrl}/verify-email?token=${token}`;

  const otpText = otp
    ? `

Or enter this verification code in the app: ${otp}

This code expires in ${config.otp.expirationMinutes} minutes.`
    : '';

  const text = `Dear user,

To verify your email, click on this link: ${verificationEmailUrl}${otpText}

If you did not create an account, ignore this email.`;

  await sendEmail(to, subject, text);
};

/**
 * Send test email
 * @param {string} to
 * @returns {Promise}
 */
const sendTestEmail = async (to) => {
  const subject = 'ProjectsHub - Test Email';
  const text = 'This is a test email from ProjectsHub verifying your email sender settings.';
  await sendEmail(to, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendTestEmail,
};
