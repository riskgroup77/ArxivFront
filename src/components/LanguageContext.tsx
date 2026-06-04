import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "cyrillic" | "latin";

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (text: string) => string;
  transliterateText: (text: string, to: Language) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// A dictionary for perfectly translating core UI elements rather than relying solely on programmatic transliteration.
// Highly optimized and precise vocabulary.
const uiTranslations: { [key: string]: string } = {
  // Authentication & Login Screen
  "Foydalanuvchi kirishi": "Фойдаланувчи кириши",
  "HEMIS tizimi va fizik arxiv integratsiyalashgan ombori": "HEMIS тизими ва физик архив интеграциялашган омбори",
  "Kadr va hujjatchilik jildlarini raqamli boshqaruv platformasi. Tizimga kirish uchun login va parol kiriting.": "Кадр ва ҳужжатчилик жилдларини рақамли бошқарув платформаси. Тизимга кириш учун логин ва парол киритинг.",
  "Foydalanuvchi nomi (Username)": "Фойдаланувчи номи (Username)",
  "Parol": "Парол",
  "Kirish": "Кириш",
  "Tizimga kirish...": "Тизимга кириш...",
  "Xato": "Хато",
  "Tizimga muvaffaqiyatli kirsangiz, barcha spravochniklar yuklanadi.": "Тизимга муваффақиятли кирсангиз, барча маълумотномалар юкланади.",

  // Headers & Global layout text
  "Institut Arxivi": "Институт Архиви",
  "Dashboard // Umumiy Statistika": "Дашборд // Умумий Статистика",
  "Qidiruv (Search) // Hujjatlar Qidiruvi": "Қидирув // Ҳужжатлар Қидируви",
  "Hujjat qabul (Intake) // Yangi Hujjat Qo'shish": "Ҳужжат қабул қилиш // Янги Ҳужжат Қўшиш",
  "Hujjatlar ro'yxati // Arxiv Hujjatlari Ombori": "Ҳужжатlar рўйхати // Архив Ҳужжатлари Омбори",
  "Kategoriyalar & Shkaflar // Tizim Spravochniklari": "Категориялар & Шкафлар // Тизим Маълумотномалари",
  "Admin panel // Tizim Sozlamalari & Audit": "Админ панели // Тизим Созламалари & Аудит",
  "Bosh Arxivchi (Admin)": "Бош Архивчи (Админ)",
  "Arxiv Operator": "Архив Оператори",
  "Arxivchi (Viewer)": "Архив кўрувчи (Viewer)",
  "Tizim holati": "Тизим ҳолати",
  "ONLINE": "ФАОЛ (ONLINE)",
  "Kanal": "Канал",
  "Sertifikatlangan LAN": "Сертификатланган LAN",
  "Faol xodim": "Faol xodim",
  "Arxiv Departament": "Архив Департаменти",

  // Sidebar Items
  "Asosiy Panel": "Асосий Панел",
  "Hujjat Qabul": "Ҳужжат Қабул Қилиш",
  "Tezkor Qidiruv": "Тезкор Қидирув",
  "Arxiv Repozitori": "Архив Репозиториси",
  "Kategoriya / Shkaf": "Категория / Шкаф",
  "Tizim Auditi / Admin": "Тизим Аудити / Админ",
  "Chiqish": "Чиқиш",

  // Dashboard Page
  "Ushbu kunda topshirilgan yangi arxiv hujjatlari soni": "Ушбу кунда топширилган янги архив ҳужжатлари сони",
  "Bugun topshirildi": "Бугун топширилди",
  "Tizimdagi faol va arxivga bog'langan turlar": "Тизимдаги фаол ва архивга боғланган турлар",
  "Faol Kategoriyalar": "Фаол Категориялар",
  "Sinflandirilgan va joylashtirilgan javonlar": "Синфлантирилган ва жойлаштирилган жавонлар",
  "Jismoniy Shkaflar": "Жисмоний Шкафлар",
  "ARXIVDAGI JAMI HUJJATLAR": "АРХИВДАГИ ЖАМИ ҲУЖЖАТЛАР",
  "JAMI RAQAMLASHTIRILGAN HUJJATLAR": "ЖАМИ РАҚАМЛАШТИРИЛГАН ҲУЖЖАТЛАР",
  "Tizim tahlili & Tezkor havolalar": "Тизим таҳлили & Тезкор ҳаволалар",
  "Hozirgina yangi hujjat qabul qilish lozimmi? Talaba ma'lumotlari kiritish va raqamli varaqlar (.pdf) fizik omborga bog'lanadi.": "Ҳозирда янги ҳужжат қабул қилиш лозимми? Талаба маълумотлари киритилиб, рақамли варақлар (.pdf) физик омборга боғланади.",
  "Yangi hujjat kiritish": "Yangi hujjat kiritish",
  "Arxivda biror o'quvchi hujjatini izlayapsizmi? Student ID (HEMIS kodi), ismi yoki sana orqali darhol qidirish.": "Архивда бирор ўқувчи ҳужжатини излаяпсизми? Student ID (HEMIS коди), исми ёки сана орқали дарҳол қидириш.",
  "Tezkor qidiruvga o'tish": "Тезкор қидирувга ўтиш",
  "Hujjatlar dinamikasi (Oylar bo'yicha)": "Ҳужжатлар динамикаси (Ойлар бўйича)",
  "Kategoriyalar bo'yicha tahlil": "Категориялар бўйича таҳлил",
  "SO'NGGI QABUL QILINGAN HUJJATLAR": "СЎНГГИ ҚАБУЛ ҚИЛИНГАН ҲУЖЖАТЛАР",
  "Arxivga yangi kelib tushgan oxirgi 5 ta hujjatning qisqa ro'yxati": "Архивга янги келиб тушган охирги 5 та ҳужжатнинг қисқа рўйхати",
  "Noma'lum O'quvchi": "Номаълум Ўқувчи",
  "Natijalar yuklanmoqda...": "Натижалар юкланмоқда...",
  "Tahliliy ma'lumotlarni hisoblashda xatolik yuz berdi": "Таҳлилий маълумотларни ҳисоблашда хатолик юз берди",
  "arxivda yozuvlar mavjud emas": "архивда ёзувлар мавжуд эмас",

  // Search Tab Page
  "Hujjatlarni Tezkor Qidirish": "Ҳужжатларни Тезкор Қидириш",
  "HEMIS tizimi orqali hujjat turi, o'quvchi talaba kodi yoki joylashuv bo'yicha tezkor qidiruv paneli": "HEMIS тизими орқали ҳужжат тури, ўқувчи талаба коди ёки жойлашув бўйича тезкор қидирув панели",
  "Fizik Qidiruv Filtrlari (AND mantiqli)": "Физик Қидирув Фильтрлари (AND мантиқли)",
  "Qirqish uchun ism yoki HEMIS kodini kiriting...": "Қидириш учун исм ёки HEMIS кодини киритинг...",
  "Hujjat turini tanlang": "Ҳужжат турини танланг",
  "Barchasi (All)": "Барчаси (Barchasi)",
  "Fizik shkafni saralang": "Физик шкафни сараланг",
  "Qabul qilingan sana (Dan)": "Қабул қилинган сана (Дан)",
  "Qabul qilingan sana (Gacha)": "Қабул қилинган сана (Гача)",
  "Qidirish": "Қидириш",
  "Tozalash": "Тозалаш",
  "Filtrlarni tozalash": "Фильтрларни тозалаш",
  "Topildi": "Topildi",
  "ta yozuv": "та ёзув",
  "Sana bo'yicha saralangan (Yangi birinchi)": "Сана бўйича сараланган (Янги биринчи)",
  "Natijalar saralanmoqda...": "Натижалар сараланмоқда...",
  "Xato yuklanish": "Хато юкланиш",
  "HECH NARSA TOPILMADI": "ҲЕЧ НАРСА ТОПИЛМАДИ",
  "Kiritilgan filtrlar bo'yicha arxivdan mos yozuvlar topilmadi. Qidiruv kalit so'zlari yoki filtrlarni o'zgartirib ko'ring.": "Киритилган фильтрлар бўйича архивдан мос ёзувлар топилмади. Қидирув калит сўзлари ёки фильтрларни ўзгартириб кўринг.",
  "O'quvchi F.I.Sh.": "Ўқувчи Ф.И.Ш.",
  "Student ID (Talaba kodi)": "Student ID (Талаба коди)",
  "Hujjat turi (Kategoriya)": "Ҳужжат тури (Категория)",
  "Qabul sanasi": "Қабул санаси",
  "Fizik Shkaf": "Физик Шкаф",
  "Qavat (Plast)": "Қават (Пласт)",
  "Holat": "Ҳолат",
  "Amallar": "Амаллар",
  "Joyida": "Жойида",
  "Berilgan": "Берилган",
  "Batafsil ma'lumot va PDF korish": "Батафсил маълумот ва PDF кўриш",
  "Fizik joylashuv voucherini chop etish": "Физик жойлашув кодини чоп этиш",
  "Chop etish": "Чоп этиш",
  
  // Document Card Side Panel / Modal
  "Arxiv Kartasi: ": "Архив Картаси: ",
  "Hujjat haqida batafsil ma'lumot": "Ҳужжат ҳақида батафсил маълумот",
  "Yopish": "Ёпиш",
  "Hujjat kategoriyasi": "Ҳужжат категорияси",
  "Hujjat holati": "Ҳужжат ҳолати",
  "Arxivga qabul qildi (Xodim)": "Архивга қабул қилди (Ходим)",
  "Qabul qilingan sana & vaqt": "Қабул қилинган сана & вақт",
  "Barcha ma'lumotlar': ": "Барча маълумотлар",
  "Talaba kodi (ID)": "Талаба коди (ID)",
  "Akademik guruh": "Академик гуруҳ",
  "Tug'ilgan yili": "Туғилган йили",
  "Muloqot telefoni": "Мулоқот телефони",
  "Fayl talqinlari": "Файл талқинлари",
  "Asl fayl nomi": "Асл файл номи",
  "Hajmi": "Ҳажми",
  "Yuklab olish": "Юклаб олиш",
  "Fizik joylashuv": "Физик жойлашув",
  "qavat": "қават",
  "Chiqarilgan sana": "Чиқарилган сана",
  "Vaqtincha olib ketdi (Mas'ul shaxs)": "Вақтинча олиб кетди (Масъул шахс)",
  "Topshirgan xodim": "Топширган ходим",
  "PDF Hujjat Korish": "PDF Ҳужжат Кўриш",
  "Sessiya tekshirilmoqda yoki PDF fayl serverda mavjud emas": "Сессия текширилмоқда ёки PDF файл серверда мавжуд эмас",

  // Slip Printing Form
  "OLIY TA'LIM MUASSASASI ARXIVI": "ОЛИЙ ТАЪЛИМ МУАССАСАСИ АРХИВИ",
  "FIZIK NUSXA HUDUDIY CHOP QILISH VOUCHERI": "ФИЗИК НУСХА ҲУДУДИЙ ЧОП ҚИЛИШ ВУЧЕРИ",
  "Hujjat Unikal kodi (ID)": "Ҳужжат Уникал коди (ID)",
  "Talaba F.I.Sh.": "Talaba F.I.Sh.",
  "HEMIS ID": "HEMIS ID",
  "Guruh": "Гуруҳ",
  "Fizik Joylashuvi": "Физик Жойлашуви",
  "Arxivga Qabul Qilingan": "Архивга Қабул Қилинган",
  "Mas'ul Operator": "Масъул Оператор",
  "QAYTARIB TOPSHIRISH SHARTI: Hujjat vaqtinchalik olinsa, 3 ish kuni ichida qayta joyiga tiklanishi shart!": "ҚАЙТАРИБ ТОПШИРИШ ШАРТИ: Ҳужжат вақтинчалик олинса, 3 иш куни ичида қайта жойига тикланиши шарт!",
  "Slip": "Вучер",

  // Intake Tab (New Document Intake)
  "Arxivga yangi hujjat qabul qilish (Physical File Intake)": "Архивга янги ҳужжат қабул қилиш (Physical File Intake)",
  "Yangi qog'ozli nusxani raqamlashtirish (.pdf) va shkafdagi fizik manzili (Stellaj, qavat) jild bilan bog'lash": "Янги қоғозли нусхани рақамлаштириш (.pdf) ва шкафдаги физик манзили (Стеллаж, қават) жилд билан боғлаш",
  "Talaba Ma'lumotlari": "Талаба Маълумотlari",
  "HEMIS Talaba kodi (*)- tahrirsiz": "HEMIS Талаба коди (*)",
  "HEMIS Talaba kodi (*)": "HEMIS Талаба коди (*)",
  "Talaba unikal kodini kiriting keyin avto-to'ldirish": "Талаба уникал кодини киритинг кейин авто-тўлдириш",
  "Izlash": "Излаш",
  "Familiya (*)": "Familiya (*)",
  "Ismi (*)": "Ismi (*)",
  "Otasining ismi": "Otasining ismi",
  "Guruh nomi (*)": "Гуруҳ номи (*)",
  "Masalan: IF-20": "Masalan: IF-20",
  "Tug'ilgan sanasi": "Туғилган санаси",
  "Telefon raqami (ixtiyoriy)": "Телефон рақами (ихтиёрий)",
  "Hujjat & Fizik Joylashuv Parametrlari": "Ҳужжат & Физик Жойлашув Параметрлари",
  "Hujjat turi (kategoriya) (*)": "Ҳужжат тури (категория) (*)",
  "Kategoriyani tanlang": "Категорияни танланг",
  "Fizik joylashadigan shkaf (*)": "Физик жойлашадиган шкаф (*)",
  "Shkafni tanlang": "Шкафни танланг",
  "Shkafdagi javon (qavat) (*)": "Шкафдаги жавон (қават) (*)",
  "Yozuv / Hujjat qo'shimcha izohi": "Ёзув / Ҳужжат қўшимча изоҳи",
  "Kitob holati, muqovasi shikastlangan tushuntirish va hk...": "Китоб ҳолати, муқоваси шикастланган тушунтириш ва ҳ.к...",
  "Raqamlangan fayl (PDF yuklash) (*)": "Рақамланган файл (PDF юклаш) (*)",
  "Drop zone": "Судраб ташланг ёки танлаш учун босинг",
  "Faqat rasmiy PDF formatidagi fayl yuklang (Maksimal 15 MB)": "Фақат расмий PDF форматидаги файл юкланг (Максимал 15 МБ)",
  "Tanlangan fayl": "Танланган файл",
  "Formani tozalash": "Формани тозалаш",
  "Arxivga Qabul Qilish": "Архивга Қабул Қилиш",
  "Qabul qilinmoqda...": "Қабул қилинмоқда...",
  "Yangi talaba topilmadi, iltimos ma'lumotlarni qo'lda kiriting!": "Янги талаба топилмади, илтимос маълумотларни қўлда киритинг!",
  "HEMIS kodi kiritilmadi": "HEMIS коди киритилмади",
  "Muvaqqat xatolik": "Муваққат хатолик",
  "Muvaffaqiyat": "Муваффақият",
  "Talaba avtomatik izlandi!": "Талаба автоматик изланди!",
  "Ushbu HEMIS kodli talaba bazada topildi! Ma'lumotlar yuklandi.": "Ушбу HEMIS кодли талаба базада топилди! Маълумотлар юкланди.",
  "HEMIS kodli talaba topilmadi. Yangi talaba ma'lumotlarini to'g'ridan-to'g'ri kiriting.": "HEMIS кодли талаба топилмади. Янги талаба маълумотларини тўғридан-тўғри киритинг.",
  "Xatolik ro'y berdi: ": "Хатолик рўй берди: ",
  "HUJJAT QABUL QILINDI!": "ҲУЖЖАТ ҚАБУЛ ҚИЛИНДИ!",
  "Ushbu talabaning raqamli hujjati muvaffaqiyatli arxivlandi va tizimda saqlandi.": "Ушбу талабанинг рақамли ҳужжати муваффақиятли архивланди ва тизимда сақланди.",
  "Yangi jismoniy qabul": "Янги жисмоний қабул",
  "Chop etiladigan yorliq": "Чоп этиладиган ёрлиқ",

  // Repository Tab (Documents Archive Vault)
  "Hujjatlar Umumiy Ro'yxati": "Ҳужжатлар Умумий Рўйхаti",
  "Arxivda ro'yxatdan o'tgan barcha jildlar va fizik nusxalar ombori": "Архивда рўйхатдан ўтган барча жилдлар ва физик нусхалар омбори",
  "Filtrlash & Qidiruv": "Фильтрлаш & Қидирув",
  "Hamma arxiv materiallari": "Ҳамма архив материаллари",
  "HEMIS kod yoki Ism": "HEMIS код ёки Исм",
  "Barcha kategoriyalar": "Барча категориялар",
  "Barcha shkaflar": "Барча шкафлар",
  "Barcha holatlar": "Барча ҳолатлар",
  "Kamida 3 ta belgi kiriting...": "Камида 3 та белги киритинг...",
  "Qabul qilingan sana": "Қабул қилинган сана",
  "Xodim (Qabul qilgan)": "Ходим (Қабул қилган)",
  "Hujjat vaqtinchalik olib chiqilganligi haqida dalolatnoma yozish": "Ҳужжат вақтинчалик олиб чиқилганлиги ҳақида далолатнома ёзиш",
  "Vaqtinchalik berish (Rent file)": "Вақтинчалик бериш (Ижара)",
  "Joyiga qaytarish (Return to Cabinet)": "Жойига қайтариш (Топшириш)",
  "Hujjatni o'chirish faqat Admin huquqiga ega foydalanuvchilarga ruxsat etiladi": "Ҳужжатларни ўчириш фақат Админ ҳуқуқига эга фойдаланувчиларга рухсат этилади",
  "O'chirish": "Ўчириш",
  "Hujjat arxivdan mutlaqo o'chiriladimi?": "Ҳужжат архивдан мутлақо ўчириладими?",
  "HUJJATNI O'CHIRISH!": "ҲУЖЖАТНИ ЎЧИРИШ!",
  "Arxivdan hujjat o'chirilishidan oldin diqqat qiling: Ushbu amalni qaytarib bo'lmaydi! Jismoniy faylni o'chirish ushbu qaydning dasturdan butkul yo'qolishiga sabab bo'ladi.": "Архивдан ҳужжат ўчирилишидан олдин диққат қилинг: Ушбу амални қайтариб бўлмайди! Жисмоний файлни ўчириш ушбу қайднинг дастурдан буткул йўқолишига сабаб бўлади.",
  "O'chirishni tasdiqlayman": "Ўчиришни тасдиқлайман",
  "Hujjatni Vaqtinchalik Tashqariga Berish (Rent Act)": "Ҳужжатни Вақтинчалик Ташқарига Бериш (租借)",
  "Hujjatni talabaga yoki dekanat mas'uliga berish talabini rasmiylashtirish": "Ҳужжатни талабага ёки деканат масъулига бериш талабини расмийлаштириш",
  "Hujjat berilayotgan shaxs (To'liq ism-sharifi) (*)": "Ҳужжат берилаётган шахс (Тўлиқ исм-шарифи) (*)",
  "Masalan: Safarov Sardor Solihovich": "Masalan: Safarov Sardor Solihovich",
  "Sana (*)- tahrirlab bo'lmaydi": "Сана (*)",
  "Arxivdan Chiqarish": "Архивдан Чиқариш",
  "Hujjat Fizik Joyiga To'liq Qaytarildi!": "Ҳужжат Физик Жойига Тўлиқ Қайтарилди!",
  "Hujjatni belgilangan raqamdagi shkaf va javonga qaytarib qo'yganingizdan so'ng, ushbu tugmani bosing. Holat 'Joyida' bo'lib yangilanadi.": "Ҳужжатни белгиланган рақамдаги шкаф ва жавонга қайтариб қўйганингиздан сўнг, ушбу тугмани босинг. Ҳолат 'Жойида' бўлиб янгиланади.",
  "Tasdiqlayman, Joyida": "Тасдиқлайман, Жойида",

  // Settings Tab (Directory configuration)
  "Mundarija va Tizim Sozlamalari": "Мундарижа ва Тизим Созламалари",
  "Arxiv tizimi uchun asosiy spravochniklar, hujjat shakllari va jismoniy shkaf (javon) spetsifikatsiyalari boshqaruvi": "Архив тизими учун асосий маълумотномалар, ҳужжат шакллари ва жисмоний шкаф (жавон) спецификациялари бошқаруви",
  "HUJJAT KATEGORIYALARI": "ҲУЖЖАТ КАТЕГОРИЯЛАРИ",
  "jami: ": "жами: ",
  "Kategoriya nomi (*)": "Категория номи (*)",
  "Izoh / Qisqa tavsifi": "Изоҳ / Қисқа тавсифи",
  "Bekor qilish": "Бекор қилиш",
  "Saqlash": "Сақлаш",
  "O'chirish?": "Ўчириш?",
  "Yo'q": "Йўқ",
  "+ YANGI KATEGORIYA QO'SHISH:": " + ЯНГИ КАТЕГОРИЯ ҚЎШИШ:",
  "Masalan: Reyting daftar": "Masalan: Reyting daftar",
  "Kategoriya qo'shish": "Категория қўшиш",
  "ARXIV SHKAFLARI (STELLAJ)": "АРХИВ ШКАФЛАРИ (СТЕЛЛАЖ)",
  "Shkaf nomi/raqami (*)": "Шкаф номи/рақами (*)",
  "Maksimal qavati (Butun son 1-99) (*)": "Максимал қавати (Бутун сон 1-99) (*)",
  "Bino yoki xonadagi fizik koordinata tavsifi": "Бино ёки хонадаги физик координата тавсифи",
  "+ YANGI SHKAF (STELLAJ) QO'SHISH:": "+ ЯНГИ ШКАФ (СТЕЛЛАЖ) ҚЎШИШ:",
  "Masalan: 4-shkaf (Zaxira)": "Masalan: 4-shkaf (Zaxira)",
  "Shkaf qo'shish": "Шкаф қўшиш",
  "Arxiv xonasi, 1-qavat metall quti": "Архив хонаси, 1-қават металл қути",
  "Xa": "Ҳа",

  // Admin Tab (Security and system accounts)
  "Tizim Nazorati va Xavfsizlik Auditi": "Тизим Назорати ва Хавфсизлик Аудити",
  "Administratorlar uchun maxsus: foydalanuvchilar hisoblari boshqaruvi va tizim harakatlari to'liq xavfsizlik audit jurnali": "Администраторлар учун махсус: фойдаланувчилар ҳисоблари бошқаруви ва тизим ҳаракатлари тўлиқ хавфсизлик аудит журнали",
  "TIZIMDAGI FOYDALANUVCHILAR": "ТИЗИМДАГИ ФОЙДАЛАНУВЧИЛАР",
  "Yangi Mas'ul Xodim Qo'shish": "Янги Масъул Ходим Қўшиш",
  "Xodim ismi va sharifi (*)- tahrirsiz": "Xodim ismi va sharifi (*)",
  "Xodim ismi va sharifi (*)": "Ходим исми ва шарифи (*)",
  "Masalan: Usmonov Sarvar": "Masalan: Usmonov Sarvar",
  "Foydalanuvchi logini (Username) (*)": "Фойдаланувчи логини (Username) (*)",
  "Yangi Parol (*)": "Янги Парол (*)",
  "Mas'ullik darajasi (Roli) (*)": "Масъуллик даражаси (Роли) (*)",
  "Foydalanuvchi faolligi": "Фойдаланувчи фаоллиги",
  "Faol foydalanuvchi": "Фаол фойдаланувчи",
  "Xodim Qo'shish": "Ходим Қўшиш",
  "Xavfsizlik Audit Jurnali": "Хавфсизлик Аудит Журнали",
  "Tizimda amalga oshirilgan to'liq backend va ma'lumotlar bazasi operatsiyalari real-vaqt jurnali": "Тизимда амалга оширилган тўлиқ backend ва маълумотлар базаси операциялари реал-вақт журнали",
  "Sana & Vaqt": "Сана & Вақт",
  "Mas'ul Operator (Log)": "Масъул Оператор (Log)",
  "Operatsiya Turi / Tafsiloti": "Операция Тури / Тафсилоти",
  "Baza Ob'ekti": "База Объекти",
  "Fizik ID": "Физик ID",
  "Ma'lumotlarni tozalashda xatolik": "Маълумотларни тозалашда хатолик",
  "Audat jurnali tozalandi": "Аудит журнали тозаланди",
  "Audit jurnali bo'sh": "Аудит журнали бўш",
};

// Extremely precise rule-based Uzbek Latin-to-Cyrillic transliterating algorithm
export function latinToCyrillic(str: string): string {
  if (!str) return str;
  let s = str;

  // 1. Convert apostrophe / single-quote characters associated with O' and G'
  // Common visual representations: o', g', o’, g’, o‘, g‘, o`, g`, o´, g´
  s = s.replace(/([oO]|[gG])[’‘`'´]/g, (match, letter) => {
    if (letter === "o") return "ў";
    if (letter === "O") return "Ў";
    if (letter === "g") return "ғ";
    if (letter === "G") return "Ғ";
    return match;
  });

  // 2. Transliterate Ye at start of words / after vowels, otherwise is E inside words
  s = s.replace(/\bYe/g, "Е").replace(/\bye/g, "е").replace(/\bYE/g, "Е");
  s = s.replace(/([aeiouyoAEIOUYOўЎ])ye/g, "$1е")
       .replace(/([aeiouyoAEIOUYOўЎ])Ye/g, "$1Е")
       .replace(/([aeiouyoAEIOUYOўЎ])YE/g, "$1Е");

  // 3. Multi-character compounds
  s = s.replace(/Ch/g, "Ч").replace(/CH/g, "Ч").replace(/ch/g, "ч");
  s = s.replace(/Sh/g, "Ш").replace(/SH/g, "Ш").replace(/sh/g, "ш");
  s = s.replace(/Yu/g, "Ю").replace(/YU/g, "Ю").replace(/yu/g, "ю");
  s = s.replace(/Ya/g, "Я").replace(/YA/g, "Я").replace(/ya/g, "я");
  s = s.replace(/Yo/g, "Ё").replace(/YO/g, "Ё").replace(/yo/g, "ё");

  // 4. Standalone E representing /e/. At start of word/after vowels, it's Э.
  s = s.replace(/\bE/g, "Э").replace(/\be/g, "э");
  s = s.replace(/([aeieuoAEIEUOўЎ])e/g, "$1э")
       .replace(/([aeieuoAEIEUOўЎ])E/g, "$1Э");

  // 5. Single letters mapping
  const charMapping: { [key: string]: string } = {
    "A": "А", "a": "а",
    "B": "Б", "b": "б",
    "D": "Д", "d": "д",
    "F": "Ф", "f": "ф",
    "G": "Г", "g": "г",
    "H": "Ҳ", "h": "ҳ",
    "I": "И", "i": "и",
    "J": "Ж", "j": "ж",
    "K": "К", "k": "к",
    "L": "Л", "l": "л",
    "M": "М", "m": "м",
    "N": "Н", "n": "н",
    "O": "О", "o": "о",
    "P": "П", "p": "п",
    "Q": "Қ", "q": "қ",
    "R": "Р", "r": "р",
    "S": "С", "s": "с",
    "T": "Т", "t": "т",
    "U": "У", "u": "у",
    "V": "В", "v": "в",
    "X": "Х", "x": "х",
    "Y": "Й", "y": "й",
    "Z": "З", "z": "з",
    "E": "Е", "e": "е", // Remaining e's inside words become Е
    "'": "ъ",
    "’": "ъ",
    "‘": "ъ",
    "`": "ъ"
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] !== undefined ? charMapping[char] : char;
  }

  return output;
}

// Highly optimized Cyrillic-to-Latin transliteration
export function cyrillicToLatin(str: string): string {
  if (!str) return str;
  let s = str;

  // Compounds first
  s = s.replace(/Ш/g, "Sh").replace(/ш/g, "sh");
  s = s.replace(/Ч/g, "Ch").replace(/ч/g, "ch");
  s = s.replace(/Ю/g, "Yu").replace(/ю/g, "yu");
  s = s.replace(/Я/g, "Ya").replace(/я/g, "ya");
  s = s.replace(/Ё/g, "Yo").replace(/ё/g, "yo");
  s = s.replace(/Ў/g, "O'").replace(/ў/g, "o'");
  s = s.replace(/Ғ/g, "G'").replace(/ғ/g, "g'");
  s = s.replace(/Ц/g, "Ts").replace(/ц/g, "ts");

  const charMapping: { [key: string]: string } = {
    "А": "A", "а": "a",
    "Б": "B", "б": "b",
    "В": "V", "в": "v",
    "Г": "G", "г": "g",
    "Д": "D", "д": "d",
    "Е": "E", "е": "e",
    "Ж": "J", "ж": "j",
    "З": "Z", "з": "z",
    "И": "I", "и": "i",
    "Й": "Y", "й": "y",
    "К": "K", "к": "k",
    "Л": "L", "l": "l",
    "М": "M", "м": "m",
    "Н": "N", "н": "n",
    "О": "O", "о": "o",
    "П": "P", "п": "p",
    "Р": "R", "р": "r",
    "С": "S", "с": "s",
    "Т": "T", "т": "t",
    "У": "U", "у": "u",
    "Ф": "F", "ф": "f",
    "Х": "X", "х": "x",
    "Ҳ": "H", "ҳ": "h",
    "Қ": "Q", "қ": "q",
    "Э": "E", "э": "e",
    "ъ": "'", "Ъ": "'"
  };

  let output = "";
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    output += charMapping[char] !== undefined ? charMapping[char] : char;
  }

  return output;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Try to find previously configured language in localStorage, default to cyrillic (as explicitly requested: "defaultda krill-lotin turishi kerak")
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("arxiv_lang");
    return (saved as Language) || "cyrillic";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("arxiv_lang", newLang);
  };

  // The custom translation helper
  const t = (text: string): string => {
    if (!text) return "";
    const trimmed = text.trim();

    // If active language is Latin, return text as is (it's written in Latin in code)
    if (lang === "latin") {
      return text;
    }

    // If active language is Cyrillic:
    // 1. Check if we have a perfect dictionary match (case sensitive or normalized)
    if (uiTranslations[trimmed] !== undefined) {
      return uiTranslations[trimmed];
    }

    // 2. Check for soft matching with colon, asterisk prefix or suffix
    const matchSuffixClean = trimmed.replace(/[\s:*()\-+]+$/, "");
    if (matchSuffixClean && uiTranslations[matchSuffixClean] !== undefined) {
      const cyrillicMain = uiTranslations[matchSuffixClean];
      // Re-append the suffixes/characters
      const difference = trimmed.substring(matchSuffixClean.length);
      return cyrillicMain + difference;
    }

    // 3. Programmatic fall-back via the transliteration engine for dynamic string values
    return latinToCyrillic(text);
  };

  // Help translate any text explicitly to a specific language
  const transliterateText = (text: string, targetLang: Language): string => {
    if (!text) return "";
    if (targetLang === "latin") {
      return cyrillicToLatin(text);
    }
    return latinToCyrillic(text);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, transliterateText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
