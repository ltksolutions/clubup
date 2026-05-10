// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { type ClientSession, type ObjectId } from 'mongodb';

import { getDb } from '../client.js';

import { EnrollmentSchema, type Enrollment } from './schema.js';

const COLLECTION = 'enrollments';

export async function findActiveEnrollment(
  args: { studentId: string; courseId: ObjectId },
  opts: { session?: ClientSession } = {}
): Promise<Enrollment | null> {
  const db = await getDb();
  const doc = await db.collection(COLLECTION).findOne(
    { studentId: args.studentId, courseId: args.courseId, state: 'active' },
    { session: opts.session }
  );
  if (!doc) return null;
  return EnrollmentSchema.parse(doc);
}

export async function listEnrollmentsForStudent(
  studentId: string,
  opts: { session?: ClientSession; includeInactive?: boolean } = {}
): Promise<Enrollment[]> {
  const db = await getDb();
  const filter = opts.includeInactive
    ? { studentId }
    : { studentId, state: 'active' as const };
  const docs = await db
    .collection(COLLECTION)
    .find(filter, { session: opts.session })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => EnrollmentSchema.parse(d));
}

export async function listEnrollmentsForCourse(
  courseId: ObjectId,
  opts: { session?: ClientSession; limit?: number } = {}
): Promise<Enrollment[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find({ courseId }, { session: opts.session })
    .sort({ createdAt: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
  return docs.map((d) => EnrollmentSchema.parse(d));
}
