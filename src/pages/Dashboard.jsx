import { createElement, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row, Statistic, Table, Tag } from 'antd';
import { UserOutlined, BookOutlined, FileTextOutlined, ReadOutlined, ArrowRightOutlined, ReloadOutlined, SoundOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services';
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function refresh() { setLoading(true); setError(''); try { setData(await adminService.getDashboardStats()); } catch { setError('Không tải được thống kê. Vui lòng thử lại.'); } finally { setLoading(false); } }
  useEffect(() => { refresh(); }, []);
  const metrics = [ ['Người học', data?.stats?.students, '/users', UserOutlined, 'teal'], ['Đề luyện thi', data?.stats?.tests, '/tests', FileTextOutlined, 'blue'], ['Câu hỏi', data?.stats?.questions, '/questions', ReadOutlined, 'orange'], ['Từ vựng', data?.stats?.vocabulary, '/vocabulary', BookOutlined, 'purple'] ];
  return <div className="dashboard">
    {error && <Alert type="error" message={error} showIcon action={<Button size="small" onClick={refresh}>Thử lại</Button>} />}
    <div className="section-toolbar"><h2>Dữ liệu hệ thống</h2><Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>Làm mới dữ liệu</Button></div>
    <Row gutter={[16, 16]}>{metrics.map(([title, value, route, Icon, color]) => <Col xs={24} sm={12} xl={6} key={title}><Card loading={loading} className="metric-card"><div className="metric-top"><span className={`metric-icon ${color}`}>{createElement(Icon)}</span></div><Statistic title={title} value={error ? '—' : value ?? '—'} /><button className="metric-link" onClick={() => navigate(route)}>Mở trang quản lý <ArrowRightOutlined /></button></Card></Col>)}</Row>
    <Row gutter={[20, 20]} className="dashboard-section"><Col span={24}><Card title="Hoạt động hôm nay" className="today-card" loading={loading}><div className="today-metric"><span><UserOutlined /> Người luyện thi</span><strong>{error ? '—' : data?.quickStats?.activeToday ?? '—'}</strong></div><div className="today-metric"><span><CheckCircleOutlined /> Bài đã hoàn thành</span><strong>{error ? '—' : data?.quickStats?.testsCompletedToday ?? '—'}</strong></div><Button type="link" onClick={() => navigate('/test-attempts')}>Xem kết quả làm bài <ArrowRightOutlined /></Button></Card></Col></Row>
    <div className="section-toolbar"><h2>Ngân hàng nội dung</h2><span className="muted">Cấu trúc TOEIC Listening & Reading</span></div>
    <Row gutter={[16, 16]}>{[['Listening', 'Part 1–4', 'Hình ảnh, hội thoại và bài nói', '/listening', SoundOutlined], ['Reading', 'Part 5–7', 'Ngữ pháp, điền từ và đọc hiểu', '/questions', ReadOutlined], ['Từ vựng', 'Theo chủ đề', 'Từ, nghĩa và ví dụ ứng dụng', '/vocabulary', BookOutlined]].map(([title, tag, text, route, Icon]) => <Col xs={24} md={8} key={title}><button className="resource-card" onClick={() => navigate(route)}><span className="resource-icon">{createElement(Icon)}</span><div><strong>{title}</strong><Tag>{tag}</Tag><p>{text}</p></div><ArrowRightOutlined /></button></Col>)}</Row>
    <Card className="dashboard-section" title="Hoạt động gần đây" extra={<Button type="link" onClick={() => navigate('/test-attempts')}>Xem tất cả <ArrowRightOutlined /></Button>}><Table loading={loading} rowKey="key" pagination={false} scroll={{ x: 580 }} dataSource={error ? [] : data?.recentActivity ?? []} locale={{ emptyText: error ? 'Chưa tải được hoạt động' : 'Chưa có lượt thi hoàn tất' }} columns={[{ title: 'Hoạt động', dataIndex: 'action' }, { title: 'Người học', dataIndex: 'user' }, { title: 'Thời gian', dataIndex: 'time' }]} /></Card>
  </div>;
}

