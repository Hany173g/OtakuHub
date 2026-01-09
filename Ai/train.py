import joblib

# 1️⃣ تحميل النموذج والـ vectorizer
model = joblib.load("text_classifier_model.joblib")
vectorizer = joblib.load("tfidf_vectorizer.joblib")

# 2️⃣ إدخال النص اللي عايز تصنفه
new_text = input("اكتب المقال هنا: ")

# 3️⃣ تحويل النص لـ TF-IDF
new_vec = vectorizer.transform([new_text])

# 4️⃣ التنبؤ بالتصنيف
predicted_category = model.predict(new_vec)

# 5️⃣ طباعة النتيجة
print("Predicted Category:", predicted_category[0])
