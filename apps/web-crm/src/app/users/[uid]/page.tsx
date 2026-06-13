import { UserDetailView } from '../../../components/UserDetailView';

type PageProps = { params: Promise<{ uid: string }> };

export default async function UserDetailPage({ params }: PageProps) {
  const { uid } = await params;
  return <UserDetailView uid={uid} />;
}
