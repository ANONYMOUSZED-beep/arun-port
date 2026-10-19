/**
 * Site settings you are expected to edit.
 *
 * Messages typed on the phone ("Contact > Write message") are delivered by the
 * first option that is configured:
 *   1. formEndpoint: a form backend such as https://formspree.io/f/xxxxxxx
 *      (free tier). Messages arrive in your inbox with the sender's email.
 *   2. email: opens the visitor's mail app with the message pre-filled.
 *   3. Neither: the message is copied and LinkedIn opens in a new tab.
 */
export const config = {
  formEndpoint: "",
  email: "",
  // Add your resume PDF to the repo and set its path, e.g. "./resume.pdf".
  // Leave empty to hide the Resume button, phone entry and text-view link.
  resumePath: "",
};
