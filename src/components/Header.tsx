import { MdLogout } from 'react-icons/md';

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="p-6 flex justify-between items-center border-b border-white/20">
      <h1 className="text-[2rem] font-extrabold tracking-wide text-outline bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary-tint)] bg-clip-text text-transparent">CodeLeap</h1>
      <button onClick={onLogout} className="text-gray-300 hover:text-[var(--color-primary)] transition-colors" title="Logout">
        <MdLogout size={24} />
      </button>
    </header>
  );
}