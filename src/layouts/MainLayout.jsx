import { useState } from 'react';
import { MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, BookOutlined, FileTextOutlined, LogoutOutlined, UserOutlined, SoundOutlined, CheckCircleOutlined, ReadOutlined, DownOutlined } from '@ant-design/icons';
import { Layout, Menu, Button, Avatar, Dropdown, Drawer, Grid, Breadcrumb } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
const { Header, Sider, Content } = Layout;
const pages = {
  '/': ['Tổng quan', 'Tổng quan hệ thống', 'Theo dõi hoạt động luyện thi và quản lý nội dung TOEIC tại một nơi.'],
  '/users': ['Người dùng', 'Quản lý người dùng', 'Tra cứu học viên, cập nhật thông tin và phân quyền tài khoản.'],
  '/tests': ['Đề luyện thi', 'Quản lý đề luyện thi', 'Xây dựng đề TOEIC, sắp xếp câu hỏi và thiết lập thời gian làm bài.'],
  '/test-attempts': ['Kết quả làm bài', 'Kết quả làm bài', 'Theo dõi lượt thi và xem chi tiết đáp án của từng người học.'],
  '/listening': ['Listening', 'Ngân hàng Listening', 'Quản lý câu hỏi nghe, hình ảnh và audio theo từng Part của bài thi TOEIC.'],
  '/questions': ['Reading', 'Ngân hàng Reading', 'Quản lý ngữ pháp, từ vựng và bài đọc theo cấu trúc TOEIC Reading.'],
  '/vocabulary': ['Từ vựng & chủ đề', 'Từ vựng & chủ đề', 'Tổ chức kho từ vựng, nghĩa và ví dụ theo các chủ đề học tập.'],
};
const groups = [
  { type: 'group', label: 'ĐIỀU HÀNH', children: [ { key: '/', icon: <DashboardOutlined />, label: 'Tổng quan' }, { key: '/users', icon: <UserOutlined />, label: 'Người dùng' }, { key: '/test-attempts', icon: <CheckCircleOutlined />, label: 'Kết quả làm bài' } ] },
  { type: 'group', label: 'NỘI DUNG TOEIC', children: [ { key: '/tests', icon: <FileTextOutlined />, label: 'Đề luyện thi' }, { key: '/listening', icon: <SoundOutlined />, label: 'Listening' }, { key: '/questions', icon: <ReadOutlined />, label: 'Reading' }, { key: '/vocabulary', icon: <BookOutlined />, label: 'Từ vựng & chủ đề' } ] },
];
function storedUser() { try { return JSON.parse(localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser') || '{}'); } catch { return {}; } }
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = pages[pathname] || pages['/'];
  const user = storedUser();
  const name = user.full_name || 'Quản trị viên';
  const logout = () => { for (const storage of [localStorage, sessionStorage]) { storage.removeItem('adminToken'); storage.removeItem('adminUser'); } navigate('/login', { replace: true }); };
  const sidebar = (compact = false) => <div className="sidebar-inner">
    <a className="admin-brand" href="/" onClick={e => { e.preventDefault(); navigate('/'); setMobileOpen(false); }}><span className="brand-symbol"><ReadOutlined /></span>{!compact && <span>TOEIC<span className="brand-subtitle">Quản trị hệ thống</span></span>}</a>
    <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={compact ? groups.flatMap(g => g.children) : groups} onClick={({ key }) => { navigate(key); setMobileOpen(false); }} />
  </div>;
  return <Layout className="admin-shell">
    {!mobile && <Sider width={248} collapsedWidth={80} collapsed={collapsed} className="admin-sidebar" trigger={null}>{sidebar(collapsed)}</Sider>}
    <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} placement="left" width={280} styles={{ body: { padding: 0, background: '#122b3b' }, header: { background: '#122b3b', color: 'white' } }} title="Điều hướng">{sidebar()}</Drawer>
    <Layout className="admin-main">
      <Header className="admin-header"><div className="header-left"><Button type="text" aria-label="Đóng mở menu" icon={collapsed || mobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => mobile ? setMobileOpen(true) : setCollapsed(!collapsed)} /><Breadcrumb items={[{ title: 'Quản trị' }, { title: page[0] }]} /></div>
        <Dropdown trigger={['click']} menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout }] }}><button className="account-button"><Avatar style={{ background: '#e3f2ed', color: '#147d71' }} icon={<UserOutlined />} /><span className="account-copy"><strong>{name}</strong><small>Quản trị hệ thống</small></span><DownOutlined /></button></Dropdown>
      </Header>
      <Content className="admin-content"><section className="page-heading"><div><h1>{page[1]}</h1><p>{page[2]}</p></div></section><div className="page-body"><Outlet /></div><footer className="admin-footer"><span>TOEIC · Hệ thống luyện thi & đánh giá năng lực</span></footer></Content>
    </Layout>
  </Layout>;
}

