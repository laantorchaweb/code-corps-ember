import Ember from "ember";
import { module, test } from 'qunit';
import startApp from '../helpers/start-app';

let application;

module('Acceptance: Project', {
  beforeEach: function() {
    application = startApp();
  },
  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test('It renders all the required ui elements', (assert) => {
  assert.expect(3);

  let sluggedRoute = server.schema.sluggedRoute.create({ slug: 'test_organization' });
  let organization = server.schema.organization.create({ slug: 'test_organization' });
  sluggedRoute.model = organization;
  sluggedRoute.save();

  let project = organization.createProject({ slug: 'test_project' });
  organization.save();
  for (let i = 0; i < 5; i++) {
    project.createPost();
  }

  project.save();

  visit('/test_organization/test_project');

  andThen(function() {
    assert.equal(find('.project-details').length, 1, 'project-details component is rendered');
    assert.equal(find('.project-post-list').length, 1, 'project-post-list component is rendered');
    assert.equal(find('.project-post-list .post-item').length, 5, 'correct number of posts is rendered');
  });
});

test('Post filtering by type works', (assert) => {
  assert.expect(5);

  // server.create uses factories. server.schema.<obj>.create does not
  let organizationId = server.create('organization').id;
  let sluggedRoute = server.schema.sluggedRoute.create({ slug: 'project_slug', modelType: 'organization' });
  let projectId = server.create('project').id;

  // need to assign polymorphic properties explicitly
  // TODO: see if it's possible to override models so we can do this in server.create
  let organization = server.schema.organization.find(organizationId);
  sluggedRoute.model = organization;
  sluggedRoute.save();

  let project = server.schema.project.find(projectId);
  project.organization = organization;
  project.save();

  server.createList('post', 1, { postType: 'idea', projectId: projectId });
  server.createList('post', 2, { postType: 'progress', projectId: projectId });
  server.createList('post', 3, { postType: 'task', projectId: projectId });
  server.createList('post', 4, { postType: 'issue', projectId: projectId });

  visit(`${sluggedRoute.slug}/${project.slug}`);

  andThen(() => {
    assert.equal(find('.project-post-list .post-item').length, 10, 'correct number of posts is rendered');
    click('.filter-ideas');
  });

  andThen(() => {
    assert.equal(find('.project-post-list .post-item').length, 1, 'only ideas are rendered');
    click('.filter-progress-posts');
  });

  andThen(() => {
    assert.equal(find('.project-post-list .post-item').length, 2, 'only progress posts are rendered');
    click('.filter-tasks');
  });

  andThen(() => {
    assert.equal(find('.project-post-list .post-item').length, 3, 'only tasks are rendered');
    click('.filter-issues');
  });

  andThen(() => {
    assert.equal(find('.project-post-list .post-item').length, 4, 'only issues are rendered');
  });
});

test('Paging of posts works', (assert) => {
  // server.create uses factories. server.schema.<obj>.create does not
  let organizationId = server.create('organization').id;
  let sluggedRoute = server.schema.sluggedRoute.create({ slug: 'project_slug', modelType: 'organization' });

  let projectId = server.create('project').id;

  // need to assign polymorphic properties explicitly
  // TODO: see if it's possible to override models so we can do this in server.create
  let organization = server.schema.organization.find(organizationId);
  sluggedRoute.model = organization;
  sluggedRoute.save();

  let project = server.schema.project.find(projectId);
  project.organization = organization;
  project.save();

  // since there's no polymorphic relationship involved, it's easy to create posts
  server.createList('post', 12, { projectId: projectId });

  visit(`${sluggedRoute.slug}/${project.slug}`);

  andThen(() => {
    assert.equal(find('.pager-control').length, 1, 'pager is rendered');
    assert.equal(find('.post-item').length, 10, 'first page of 10 records is rendered');
    click('.pager-control .page-button.2');
  });

  andThen(() => {
    assert.equal(find('.post-item').length, 2, 'second page of 2 records is rendered');
  });
});

test('Paging and filtering of posts combined works', (assert) => {
  // server.create uses factories. server.schema.<obj>.create does not
  let organizationId = server.create('organization').id;
  let sluggedRoute = server.schema.sluggedRoute.create({ slug: 'project_slug', modelType: 'organization' });

  let projectId = server.create('project').id;

  // need to assign polymorphic properties explicitly
  // TODO: see if it's possible to override models so we can do this in server.create
  let organization = server.schema.organization.find(organizationId);
  sluggedRoute.model = organization;
  sluggedRoute.save();

  let project = server.schema.project.find(projectId);
  project.organization = organization;
  project.save();

  // since there's no polymorphic relationship involved, it's easy to create posts
  server.createList('post', 12, { postType: 'task', projectId: projectId });
  server.createList('post', 12, { postType: 'issue', projectId: projectId });

  visit(`${sluggedRoute.slug}/${project.slug}`);

  andThen(() => {
    assert.equal(find('.post-item').length, 10, 'first page of 10 posts is rendered');
    click('.pager-control .page-button.2');
  });

  andThen(() => {
    assert.equal(find('.post-item').length, 10, 'second page of 10 posts is rendered');
    click('.pager-control .page-button.3');
  });

  andThen(() => {
    assert.equal(find('.post-item').length, 4, 'third page of 4 posts is rendered');
    click('.filter-tasks');
  });

  andThen(() => {
    assert.equal(find('.post-item.task').length, 10, 'first page of 10 tasks is rendered');
    click('.pager-control .page-button.2');
  });

  andThen(() => {
    assert.equal(find('.post-item.task').length, 2, 'second page of 2 tasks is rendered');
    assert.equal(find('.post-item').length, 2, 'there are no other posts rendered');
    click('.filter-issues');
  });

  andThen(() => {
    assert.equal(find('.post-item.issue').length, 10, 'first page of 10 issues is rendered');
    click('.pager-control .page-button.2');
  });

  andThen(() => {
    assert.equal(find('.post-item.issue').length, 2, 'second page of 2 issues is rendered');
    assert.equal(find('.post-item').length, 2, 'there are no other posts rendered');
  });
});