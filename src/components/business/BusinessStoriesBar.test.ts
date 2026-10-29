import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BUSINESS_DASHBOARD_STORIES,
  markStoryIdAsSeen,
  resolveNextStoryPosition,
} from './BusinessStoriesBar';
import { resolveActiveBusinessGroup } from '../navigation/BusinessMobileNavigation';

test('BUSINESS_DASHBOARD_STORIES contains valid stories with slides and direct internal links', () => {
  assert.ok(BUSINESS_DASHBOARD_STORIES.length >= 5);
  for (const story of BUSINESS_DASHBOARD_STORIES) {
    assert.ok(story.slides.length >= 1);
    for (const slide of story.slides) {
      assert.ok(slide.ctaHref.startsWith('/app'));
      assert.ok(slide.ctaLabel.length > 3);
    }
  }
});

test('resolveNextStoryPosition advances across slides and stories and closes at the end', () => {
  // First story has 2 slides
  const step1 = resolveNextStoryPosition({
    stories: BUSINESS_DASHBOARD_STORIES,
    storyIndex: 0,
    slideIndex: 0,
    direction: 'NEXT',
  });
  assert.equal(step1.storyIndex, 0);
  assert.equal(step1.slideIndex, 1);
  assert.equal(step1.shouldClose, false);

  // Next from slide 1 of story 0 moves to story 1, slide 0
  const step2 = resolveNextStoryPosition({
    stories: BUSINESS_DASHBOARD_STORIES,
    storyIndex: 0,
    slideIndex: 1,
    direction: 'NEXT',
  });
  assert.equal(step2.storyIndex, 1);
  assert.equal(step2.slideIndex, 0);
  assert.equal(step2.shouldClose, false);

  // Next from last slide of last story closes viewer
  const lastIdx = BUSINESS_DASHBOARD_STORIES.length - 1;
  const lastSlideIdx = BUSINESS_DASHBOARD_STORIES[lastIdx].slides.length - 1;
  const stepEnd = resolveNextStoryPosition({
    stories: BUSINESS_DASHBOARD_STORIES,
    storyIndex: lastIdx,
    slideIndex: lastSlideIdx,
    direction: 'NEXT',
  });
  assert.equal(stepEnd.shouldClose, true);
});

test('markStoryIdAsSeen appends unique story IDs without duplicates', () => {
  const initial = ['story-quickstart'];
  const afterSame = markStoryIdAsSeen(initial, 'story-quickstart');
  assert.equal(afterSame.length, 1);

  const afterNew = markStoryIdAsSeen(initial, 'story-services');
  assert.deepEqual(afterNew, ['story-quickstart', 'story-services']);
});

test('resolveActiveBusinessGroup maps routes to primary sticky bottom nav groups and sub-tabs', () => {
  const dashGroup = resolveActiveBusinessGroup('/app');
  assert.equal(dashGroup.id, 'dashboard');
  assert.equal(dashGroup.subTabs.length, 0);

  const salonGroup = resolveActiveBusinessGroup('/app/working-hours');
  assert.equal(salonGroup.id, 'salon');
  assert.equal(salonGroup.subTabs.length, 6);

  const bookingsGroup = resolveActiveBusinessGroup('/app/calendar');
  assert.equal(bookingsGroup.id, 'bookings');
  assert.equal(bookingsGroup.subTabs.length, 2);

  const customersGroup = resolveActiveBusinessGroup('/app/marketing');
  assert.equal(customersGroup.id, 'customers');
  assert.equal(customersGroup.subTabs.length, 2);

  const financeGroup = resolveActiveBusinessGroup('/app/subscription');
  assert.equal(financeGroup.id, 'finance');
  assert.equal(financeGroup.subTabs.length, 2);
});
