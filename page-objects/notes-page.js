'use strict';

const { expect } = require('@playwright/test');

class NotesPage {
  constructor(page) {
    this.page = page;
    this.titleInput = page.getByTestId('note-title-input');
    this.bodyInput = page.getByTestId('note-body-input');
    this.tagsInput = page.getByTestId('note-tags-input');
    this.saveButton = page.getByTestId('note-save-button');
    this.formHeading = page.getByTestId('form-heading');
    this.searchInput = page.getByTestId('search-input');
    this.sortSelect = page.getByTestId('sort-select');
    this.noteItems = page.getByTestId('note-item');
    this.summaryPanel = page.getByTestId('summary-panel');
    this.summaryText = page.getByTestId('summary-text');
    this.summaryLoading = page.getByTestId('summary-loading');
    this.summaryVerified = page.getByTestId('summary-verified');
    this.summaryWarning = page.getByTestId('summary-warning');
    this.toast = page.getByTestId('toast');
  }

  noteItem(title) {
    return this.page.locator('[data-testid="note-item"]', { hasText: title });
  }

  async createNote(title, body = '', tags = '') {
    await this.titleInput.fill(title);
    await this.bodyInput.fill(body);
    await this.tagsInput.fill(tags);
    await this.saveButton.click();
    await expect(this.noteItem(title)).toBeVisible();
  }

  async summarizeNote(title) {
    await this.noteItem(title).getByTestId('note-summarize-button').click();
    await expect(this.summaryText).toBeVisible();
  }

  // Delete uses the app's two-step inline confirmation: first click arms
  // "Confirm delete" (data-confirming="true"), second click actually deletes
  // and detaches the row as soon as the API responds.
  async deleteNote(title) {
    const item = this.noteItem(title);
    const deleteButton = item.getByTestId('note-delete-button');
    await deleteButton.click();
    await expect(deleteButton).toHaveAttribute('data-confirming', 'true');
    await Promise.all([item.waitFor({ state: 'detached' }), deleteButton.click()]);
  }

  async openEditorFor(title) {
    await this.noteItem(title).getByTestId('note-edit-button').click();
    await expect(this.titleInput).toHaveValue(title);
  }

  async search(query) {
    await this.searchInput.fill(query);
  }

  async sortBy(value) {
    await this.sortSelect.selectOption(value);
  }
}

module.exports = { NotesPage };
