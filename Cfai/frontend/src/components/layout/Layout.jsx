import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopBar title={title} subtitle={subtitle} />
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
}
