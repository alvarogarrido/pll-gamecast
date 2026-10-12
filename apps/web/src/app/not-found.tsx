import { ActionButton, StatePanel } from '@/components/states/StatePanel';

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-page px-4 py-10 md:px-6">
      <StatePanel
        title="Page not found"
        message="That game or page doesn't exist."
        action={<ActionButton href="/">Back to games</ActionButton>}
      />
    </main>
  );
}
