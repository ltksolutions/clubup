// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { type ClientSession, type ObjectId } from 'mongodb';

import { getDb } from '../client.js';
import { NotFound } from '../errors.js';

import { CourseSchema, type Course } from './schema.js';

const COLLECTION = 'courses';

export async function findCourseById(
  id: ObjectId,
  opts: { session?: ClientSession } = {}
): Promise<Course | null> {
  const db = await getDb();
  const doc = await db
    .collection(COLLECTION)
    .findOne({ _id: id }, { session: opts.session });
  if (!doc) return null;
  return CourseSchema.parse(doc);
}

export async function findCourseBySlug(
  slug: string,
  opts: { session?: ClientSession; includeUnpublished?: boolean } = {}
): Promise<Course | null> {
  const db = await getDb();
  const filter = opts.includeUnpublished
    ? { slug }
    : { slug, state: 'published' as const };

  // Pick the latest version when multiple exist.
  const doc = await db
    .collection(COLLECTION)
    .find(filter, { session: opts.session })
    .sort({ version: -1 })
    .limit(1)
    .next();

  if (!doc) return null;
  return CourseSchema.parse(doc);
}

export async function listPublishedCourses(
  opts: { session?: ClientSession; limit?: number } = {}
): Promise<Course[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ state: 'published' }, { session: opts.session })
    .sort({ publishedAt: -1 })
    .limit(opts.limit ?? 50)
    .toArray();
  return docs.map((d) => CourseSchema.parse(d));
}

export async function requireCourseById(
  id: ObjectId,
  opts: { session?: ClientSession } = {}
): Promise<Course> {
  const course = await findCourseById(id, opts);
  if (!course) throw new NotFound(`course:${id.toString()}`);
  return course;
}
