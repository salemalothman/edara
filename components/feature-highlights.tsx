"use client"

import { useLanguage } from "@/contexts/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, MessageSquare, Settings, Users, Wrench } from "lucide-react"

// Feature data with translations
const features = [
  {
    id: "tenant-management",
    icon: <Users className="h-6 w-6" />,
    titleEn: "Tenant & Contract Management",
    titleAr: "إدارة المستأجرين والعقود",
    descriptionEn:
      "Create, renew, and manage tenant contracts with flexible terms, digital signatures, and electronic records.",
    descriptionAr: "إنشاء وتجديد وإدارة عقود المستأجرين بشروط مرنة وتوقيعات رقمية وسجلات إلكترونية.",
    badge: "core",
  },
  {
    id: "financial-management",
    icon: <CreditCard className="h-6 w-6" />,
    titleEn: "Financial Management",
    titleAr: "الإدارة المالية",
    descriptionEn:
      "Track payments, manage invoices, and process rent collections through secure payment gateways with Visa and MasterCard integration.",
    descriptionAr:
      "تتبع المدفوعات وإدارة الفواتير ومعالجة تحصيلات الإيجار من خلال بوابات دفع آمنة مع تكامل فيزا وماستركارد.",
    badge: "premium",
  },
  {
    id: "reporting",
    icon: <FileText className="h-6 w-6" />,
    titleEn: "Reporting & Analytics",
    titleAr: "التقارير والتحليلات",
    descriptionEn:
      "Generate real-time financial analytics, monthly reports, and portfolio performance overviews with customizable parameters.",
    descriptionAr:
      "إنشاء تحليلات مالية في الوقت الفعلي وتقارير شهرية ونظرة عامة على أداء المحفظة مع معلمات قابلة للتخصيص.",
    badge: "premium",
  },
  {
    id: "communication",
    icon: <MessageSquare className="h-6 w-6" />,
    titleEn: "Communication & Notifications",
    titleAr: "الاتصالات والإشعارات",
    descriptionEn:
      "Send automated alerts and reminders via SMS, Email, and WhatsApp for payments, maintenance, and other important updates.",
    descriptionAr:
      "إرسال تنبيهات وتذكيرات آلية عبر الرسائل القصيرة والبريد الإلكتروني وواتساب للمدفوعات والصيانة والتحديثات المهمة الأخرى.",
    badge: "standard",
  },
  {
    id: "maintenance",
    icon: <Wrench className="h-6 w-6" />,
    titleEn: "Maintenance Management",
    titleAr: "إدارة الصيانة",
    descriptionEn:
      "Handle service requests, track maintenance progress, and generate work orders for vendors or in-house service providers.",
    descriptionAr: "التعامل مع طلبات الخدمة وتتبع تقدم الصيانة وإنشاء أوامر عمل للموردين أو مقدمي الخدمة الداخليين.",
    badge: "core",
  },
  {
    id: "user-management",
    icon: <Settings className="h-6 w-6" />,
    titleEn: "User & Access Management",
    titleAr: "إدارة المستخدمين والوصول",
    descriptionEn:
      "Configure role-based access control, manage user permissions, and track user actions with detailed audit logs.",
    descriptionAr:
      "تكوين التحكم في الوصول المستند إلى الأدوار وإدارة أذونات المستخدم وتتبع إجراءات المستخدم باستخدام سجلات تدقيق مفصلة.",
    badge: "standard",
  },
]

// Badge translations
const badgeTranslations = {
  core: {
    en: "Core",
    ar: "أساسي",
  },
  standard: {
    en: "Standard",
    ar: "قياسي",
  },
  premium: {
    en: "Premium",
    ar: "متميز",
  },
}

// Badge colors
const badgeColors = {
  core: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  standard: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  premium: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

export function FeatureHighlights() {
  const { language, t } = useLanguage()

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold mb-4 ${language === "ar" ? "font-arabic" : ""}`}>
            {t("common.features.title")}
          </h2>
          <p className={`text-muted-foreground max-w-3xl mx-auto ${language === "ar" ? "font-arabic" : ""}`}>
            {t("common.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="rounded-full bg-primary/10 p-2 text-primary">{feature.icon}</div>
                <div>
                  <CardTitle className={language === "ar" ? "font-arabic text-right" : ""}>
                    {language === "ar" ? feature.titleAr : feature.titleEn}
                  </CardTitle>
                  <Badge variant="outline" className={`mt-1 ${badgeColors[feature.badge as keyof typeof badgeColors]}`}>
                    {t(`common.features.badges.${feature.badge}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className={`text-sm ${language === "ar" ? "font-arabic text-right" : ""}`}>
                  {language === "ar" ? feature.descriptionAr : feature.descriptionEn}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
