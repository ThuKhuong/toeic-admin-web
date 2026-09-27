const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{
    const url=route.request().url();
    let data=[];
    if(url.includes('dashboard-stats'))data={stats:{students:128,tests:24,questions:680,vocabulary:420},quickStats:{activeToday:18,testsCompletedToday:32},recentActivity:[{key:1,action:'Hoàn thành Part 5',user:'Nguyễn Minh Anh',time:'24/09/2026'}]};
    if(url.includes('/attempts'))data={attempts:[],pagination:{total:0},stats:{totalAttempts:0}};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto('http://127.0.0.1:5174/login');
  await page.evaluate(()=>{localStorage.setItem('adminToken','ui-test-only');localStorage.setItem('adminUser',JSON.stringify({full_name:'Quản trị viên',role:'ADMIN'}));});
  fs.mkdirSync('artifacts/admin-ui',{recursive:true});
  for(const [path,title] of [['/','Tổng quan hệ thống'],['/listening','Ngân hàng Listening'],['/questions','Ngân hàng Reading'],['/users','Quản lý người dùng'],['/tests','Quản lý đề luyện thi'],['/test-attempts','Kết quả làm bài'],['/vocabulary','Từ vựng & chủ đề']]){
    await page.goto('http://127.0.0.1:5174'+path);
    await page.getByRole('heading',{name:title,exact:true}).waitFor();
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Desktop horizontal overflow: '+path);
    if(path==='/'||path==='/listening')await page.screenshot({path:'artifacts/admin-ui/'+(path==='/'?'dashboard':'listening')+'.png',fullPage:true});
    if(path==='/listening'){await page.getByRole('tab',{name:'Part 3 - Conversations'}).click();await page.getByRole('tab',{name:'Part 3 - Conversations'}).getAttribute('aria-selected').then(v=>assert.equal(v,'true'));}
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Mobile horizontal overflow: '+path);
    await page.setViewportSize({width:1440,height:1000});
  }
  await page.getByRole('button',{name:/Quản trị viên/}).click();
  await page.getByText('Đăng xuất',{exact:true}).click();
  await page.waitForURL('**/login');
  assert.equal(await page.evaluate(()=>localStorage.getItem('adminToken')),null);
  await page.screenshot({path:'artifacts/admin-ui/login.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Login mobile overflow');
  await page.getByRole('button',{name:'Đăng nhập hệ thống'}).click();
  await page.getByText('Vui lòng nhập email.').waitFor();
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('PASS: 7 admin routes at desktop/mobile, Listening tabs, logout, login validation; no browser runtime errors. API responses were mocked.');
})().catch(e=>{console.error(e);process.exit(1)});

