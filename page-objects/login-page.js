'use strict';

class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId('email-input');
    this.passwordInput = page.getByTestId('password-input');
    this.loginButton = page.getByTestId('login-button');
    this.error = page.getByTestId('login-error');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async loginAs(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };
