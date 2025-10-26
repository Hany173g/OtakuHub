# OtakuHub Admin Dashboard

لوحة تحكم إدارية منفصلة لموقع OtakuHub

## المميزات

### 🔐 نظام المصادقة
- تسجيل دخول آمن للمديرين فقط
- Access Token (15 دقيقة)
- Refresh Token (يوم واحد) - httpOnly cookie
- تحديث تلقائي للـ tokens
- تسجيل خروج آمن

### 📊 لوحة التحكم
- إحصائيات المستخدمين (اليوم / الإجمالي)
- إحصائيات المنشورات (اليوم / الإجمالي)
- إحصائيات الزيارات (اليوم / الإجمالي)
- تحليلات النمو
- المستخدمون الجدد
- رسوم بيانية تفاعلية

### 🎨 التصميم
- Material-UI مع تصميم عربي
- دعم RTL كامل
- خط Cairo
- ألوان متدرجة جميلة
- Responsive design

## التشغيل

```bash
# تثبيت المكتبات
npm install

# إنشاء ملف .env.local (نسخ من .env.example)
copy .env.example .env.local

# تشغيل التطوير على port 4000
npm run dev
# أو
npm start

# بناء للإنتاج
npm run build
```

### ⚠️ ملاحظة مهمة للـ Backend
يجب إضافة port 4000 للـ CORS في backend/server.js:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'], // إضافة port 4000
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

## البنية

```
src/
├── lib/
│   └── api.js          # API utilities مع axios interceptors
├── pages/
│   ├── Login.jsx       # صفحة تسجيل الدخول
│   └── Dashboard.jsx   # لوحة التحكم الرئيسية
├── App.js              # التطبيق الرئيسي مع routing
└── index.js            # نقطة البداية
```

## الـ API Endpoints

- `POST /api/dashboard/login` - تسجيل الدخول
- `POST /api/dashboard/refreshToken` - تحديث الـ token
- `POST /api/dashboard/logout` - تسجيل الخروج
- `POST /api/dashboard/getHome` - بيانات لوحة التحكم

## المتطلبات

- Node.js 16+
- Backend OtakuHub يعمل على localhost:5000
- مستخدم بصلاحية Admin في قاعدة البيانات

## الأمان

- Access tokens قصيرة المدى (15 دقيقة)
- Refresh tokens في httpOnly cookies
- تحقق من صلاحيات Admin
- تسجيل خروج تلقائي عند انتهاء الصلاحية
