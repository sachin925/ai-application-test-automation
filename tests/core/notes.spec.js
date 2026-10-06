'use strict';

const { test, expect } = require('../../fixtures');
const { NotesPage } = require('../../page-objects/notes-page');

test('creates a note that is visible in the list and via the API @core', async ({
  appPage: page,
  authedApi,
}) => {
  const notes = new NotesPage(page);
  await notes.createNote('Framework test note', 'created by the automation framework', 'qa');

  const { status, body } = await authedApi.listNotes({ q: 'Framework test note' });
  expect(status).toBe(200);
  expect(body.notes).toHaveLength(1);
  expect(body.notes[0].tags).toEqual(['qa']);
});

test('whitespace-only title is rejected with title_required @core', async ({
  appPage: page,
  authedApi,
}) => {
  const apiResult = await authedApi.createNote({ title: '   ', body: 'no title' });
  expect(apiResult.status).toBe(400);
  expect(apiResult.body.error).toBe('title_required');

  const notes = new NotesPage(page);
  await notes.createNote('Has a title', 'body');

  // Native `required` validation blocks truly empty titles client-side.
  await notes.titleInput.fill('');
  await notes.saveButton.click();
  await expect(notes.noteItems).toHaveCount(6); // 5 seed + 1, unchanged
  await expect(notes.toast).not.toContainText('title_required');

  // Whitespace passes client-side validation but the server trims and rejects.
  await notes.titleInput.fill('   ');
  await notes.saveButton.click();
  await expect(notes.toast).toContainText('title_required');
});

test('edit prefills the form and saves changes @core', async ({ appPage: page, authedApi }) => {
  const notes = new NotesPage(page);
  await notes.createNote('Edit me', 'original body');

  await notes.openEditorFor('Edit me');
  await expect(notes.formHeading).toHaveText(/edit/i);
  await notes.titleInput.fill('Edited title');
  await notes.saveButton.click();
  await expect(notes.noteItem('Edited title')).toBeVisible();

  const { body } = await authedApi.listNotes({ q: 'Edited title' });
  expect(body.notes[0].body).toBe('original body');
});

test('delete requires the two-step inline confirmation @core', async ({
  appPage: page,
  authedApi,
}) => {
  const notes = new NotesPage(page);
  await notes.createNote('Delete me', '');

  // First click arms the confirmation but must not delete yet.
  const item = notes.noteItem('Delete me');
  const deleteButton = item.getByTestId('note-delete-button');
  await deleteButton.click();
  await expect(deleteButton).toHaveAttribute('data-confirming', 'true');
  await expect(deleteButton).toHaveText('Confirm delete');
  await expect(item).toBeVisible();

  // Second click confirms; the row detaches as soon as the API responds.
  await Promise.all([item.waitFor({ state: 'detached' }), deleteButton.click()]);
  const { body } = await authedApi.listNotes({ q: 'Delete me' });
  expect(body.notes).toHaveLength(0);
});

test('search filters the list (debounced) and clearing restores it @core', async ({
  appPage: page,
}) => {
  const notes = new NotesPage(page);
  await notes.createNote('Alpha bravo', '');
  await notes.createNote('Charlie delta', '');
  await expect(notes.noteItems).toHaveCount(7); // 5 seed + 2 new

  await notes.search('alpha');
  await expect(notes.noteItems).toHaveCount(1);
  await expect(notes.noteItems).toContainText('Alpha bravo');

  await notes.search('');
  await expect(notes.noteItems).toHaveCount(7);
});

test('sort select orders the list by title @core', async ({ appPage: page }) => {
  const notes = new NotesPage(page);
  await notes.sortBy('title-asc');
  await expect(notes.noteItems.first().getByTestId('note-title')).toHaveText('Books to read');

  await notes.sortBy('title-desc');
  await expect(notes.noteItems.first().getByTestId('note-title')).toHaveText('Weekly groceries');
});
