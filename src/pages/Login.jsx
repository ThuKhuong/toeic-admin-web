import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Checkbox,

  Alert,

} from "antd";
import { UserOutlined, LockOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { authService } from "../services";



const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.login(values.email, values.password);
      if (response.token) {
        // Kiểm tra role chỉ cho phép ADMIN
        if (response.user?.role !== "ADMIN") {
          setError(
            "Bạn không có quyền truy cập trang quản trị. Chỉ dành cho ADMIN."
          );
          return;
        }
        for (const previous of [localStorage, sessionStorage]) { previous.removeItem('adminToken'); previous.removeItem('adminUser'); }
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("adminToken", response.token);
        if (response.user) {
          storage.setItem("adminUser", JSON.stringify(response.user));
        }
        navigate("/");
      } else {
        setError("Email hoặc mật khẩu không đúng");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Email hoặc mật khẩu không đúng");
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page">
    <section className="login-story">
      <div className="admin-brand"><span className="brand-symbol"><BookOutlined /></span><span>TOEIC<span className="brand-subtitle">Quản trị hệ thống</span></span></div>
      <div><h1>Quản trị TOEIC</h1><p>Quản lý câu hỏi, đề luyện thi và kết quả học tập.</p><div className="login-topics"><span>Listening</span><span>Reading</span><span>Đánh giá năng lực</span></div></div>
      <footer>Hệ thống luyện thi TOEIC</footer>
    </section>
    <section className="login-form-area"><div className="login-form-box"><h2>Đăng nhập quản trị</h2><p>Sử dụng tài khoản quản trị viên để đăng nhập.</p>
      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError('')} />}
      <Form name="login" layout="vertical" size="large" onFinish={onFinish}>
        <Form.Item name="email" label="Email quản trị" rules={[{ required: true, message: 'Vui lòng nhập email.' }, { type: 'email', message: 'Email không hợp lệ.' }]}><Input prefix={<UserOutlined />} placeholder="admin@example.com" autoComplete="username" /></Form.Item>
        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}><Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu của bạn" autoComplete="current-password" /></Form.Item>
        <Form.Item><Checkbox checked={remember} onChange={e => setRemember(e.target.checked)}>Ghi nhớ đăng nhập</Checkbox></Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>Đăng nhập hệ thống</Button>
      </Form><p className="login-caption">Khu vực dành riêng cho tài khoản được cấp quyền quản trị.</p>
    </div></section>
  </main>;
};
export default Login;
