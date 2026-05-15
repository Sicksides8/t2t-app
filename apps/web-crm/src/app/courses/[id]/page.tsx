import { CourseDetailView } from '../../../components/CourseDetailView';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetailView courseId={id} />;
}
