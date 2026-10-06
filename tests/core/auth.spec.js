'use strict';

const { test, expect, USER } = require('../../fixtures');
const { LoginPage } = require('../../page-objects/login-page');

test('valid login lands on the notes app @core', async ({ page, api }) => {
  await api.reset();
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(USER.email, USER.password);
  await expect(page).toHaveURL('/');
  await expect(page.getByTestId('notes-list')).toBeVisible();
  await expect(page.getByTestId('user-email')).toHaveText(USER.email);
});

test('invalid credentials show an error and stay on login @core', async ({ page, api }) => {
  await api.reset();
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(USER.email, 'wrong-password');
  await expect(login.error).toBeVisible();
  await expect(login.error).toHaveText('Invalid email or password');
  await expect(page).toHaveURL('/login');
});

test('login API rejects bad credentials with 401 @core', async ({ api }) => {
  await api.reset();
  const { status, body } = await api.login(USER.email, 'wrong-password');
  expect(status).toBe(401);
  expect(body.error).toBe('invalid_credentials');
});

test('unauthenticated requests are rejected @core', async ({ page, api }) => {
  await api.reset();
  const me = await api.me();
  expect(me.status).toBe(401);
  const notes = await api.listNotes();
  expect(notes.status).toBe(401);

  await page.goto('/');
  await expect(page).toHaveURL('/login');
});

test('session persists across reloads and logout ends it @core', async ({ page, api }) => {
  await api.reset();
  const login = new LoginPage(page);
  await login.goto();
  await login.loginAs(USER.email, USER.password);
  await expect(page.getByTestId('notes-list')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('notes-list')).toBeVisible();

  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL('/login');
  const me = await api.me();
  expect(me.status).toBe(401);
});
