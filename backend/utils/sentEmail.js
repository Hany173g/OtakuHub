const sentEmail = async(resetLink,user) => {
    




    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
        service:'gmail',
        auth:{
            user:"hanykholey1@gmail.com",
            pass:'pfthitlsoaffvefo'
        }
    })




    const mailoption = {
        from: 'hanykholey1@gmail.com',
        to:user,
        subject: "Reset Password Otaku Hub",
        html: 
        `
                    <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
            <meta charset="UTF-8">
            <title>Reset Password</title>
            <style>
                body {
                font-family: Arial, sans-serif;
                background-color: #f5f5f5;
                color: #333;
                padding: 20px;
                }
                .container {
                max-width: 600px;
                margin: auto;
                background-color: #fff;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                h2 {
                color: #ff6f61;
                }
                p {
                font-size: 16px;
                line-height: 1.5;
                }
                .btn {
                display: inline-block;
                padding: 12px 25px;
                margin-top: 20px;
                background-color: #ff6f61;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                }
                .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #888;
                }
            .alert {
            background-color: #ffdddd; /* لون خلفية خفيف أحمر */
            color: #d8000c;           /* لون الخط أحمر داكن */
            padding: 15px 20px;       /* مسافة داخلية حول النص */
            border: 1px solid #d8000c; /* حدود بنفس لون النص */
            border-radius: 5px;       /* زوايا مدورة */
            font-size: 16px;          /* حجم الخط */
            text-align: center;       /* توسيط النص */
            max-width: 400px;         /* أقصى عرض للرسالة */
            margin: 20px auto;        /* توسيط الصندوق داخل الصفحة */
            box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* ظل خفيف */
            animation: fadeOut 1s ease-in-out 3600s forwards; /* الرسالة تختفي بعد ساعة */
        }

            </style>
            </head>
            <body>
            <div class="container">
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>لقد طلبت إعادة تعيين كلمة المرور في موقعنا. اضغط على الزر أدناه لتعيين كلمة مرور جديدة:</p>
                <a href="http://localhost:3000/forget-password/${resetLink}" class="btn">إعادة تعيين كلمة المرور</a>
                <p class="alert">هذا الرابط صالح لمده ساعه فقط</p>
                <p>إذا لم تطلب هذا، يمكنك تجاهل هذا الإيميل بأمان.</p>
                <div class="footer">
                © 2025 موقع الأنمي الخاص بنا
                </div>
            </div>
            </body>
            </html>
        `

    }




transporter.sendMail(mailoption,(err,suces) =>
{
    if (err)
    {
        console.log("faild send email",err)
    }
    else
    {
        console.log("succes send email")
    }
})
}


module.exports = {sentEmail}

















