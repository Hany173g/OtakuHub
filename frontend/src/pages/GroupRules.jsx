import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Stack
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Gavel as GavelIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import { checkGroupAccess } from '../lib/api'

const ADMIN_RULES = [
  'صاحب الموقع له الحق الكامل في إدارة كل شيء داخل الجروب، بما في ذلك: تعديل اسم الجروب، وصفه، صوره، وإعداداته.',
  'صاحب الموقع يمكنه إضافة أو إزالة أي عضو من الجروب في أي وقت دون الحاجة لموافقة أحد.',
  'صاحب الموقع له الحق في تعيين أو إلغاء أي أدمن أو مشرف حسب رؤيته لإدارة الجروب.',
  'صاحب الموقع مسؤول عن مراقبة المحتوى وضمان التزام الأعضاء بالقوانين.',
  'أي مخالفة للقوانين يمكن لصاحب الموقع التعامل معها مباشرة، بما في ذلك التحذير أو الحظر النهائي.',
  'صاحب الموقع له الحق في حذف أو تعديل أي منشور أو تعليق لأي سبب يراه مناسبًا.',
  'صاحب الموقع له الحق في إدارة جميع الملفات، الصور، والفيديوهات المرفوعة في الجروب.',
  'صاحب الموقع له الحق في إدارة أي ميزة تقنية داخل الجروب، مثل استفتاءات، مسابقات، أو إعدادات الخصوصية.',
  'صاحب الموقع له الحق في تحديث القوانين وإضافة أي قواعد جديدة وإخبار الأعضاء بها.',
  'جميع قرارات صاحب الموقع نهائية وملزمة لجميع الأعضاء والإدمنز داخل الجروب.'
]

const GENERAL_RULES = [
  'لا يُسمح بنشر أي محتوى +18، وإلا سيتم معاقبة صاحب الجروب.',
  'صاحب الجروب هو فقط القادر على تغيير اسم الجروب أو حذفه تمامًا.',
  'إذا تم حذف حساب صاحب الجروب لأي سبب من الأسباب فسوف يقوم الجروب بتعيين أدمن مكان صاحب الجروب.',
  'لا يُسمح بنشر روابط عشوائية أو رسائل سبام أو إعلانات غير مصرح بها.',
  'لا يُسمح للعضو بامتلاك أكثر من حساب واحد في نفس الجروب.',
  'لا يُسمح بعمل مسابقات أو استفتاءات إلا بعد موافقة صاحب الجروب أو أحد الإدمنز.',
  'في حال وجود أي تحديثات أو تغييرات في القوانين، سيتم إخبار الأعضاء بها داخل الجروب.',
  'يجب احترام جميع الأعضاء وعدم استخدام ألفاظ مسيئة أو مهينة.',
  'النقاشات السياسية أو الدينية المثيرة للجدل ممنوعة لتجنب النزاعات بين الأعضاء.',
  'يُفضل الالتزام بموضوع الجروب وعدم نشر محتوى غير متعلق بهدفه الأساسي.',
  'أي محاولة لاختراق أو استغلال ثغرات في النظام ستؤدي إلى حظر فوري ودائم.',
  'الإدمنز لهم الحق في حذف أي منشور أو تعليق يرونه غير مناسب حتى لو لم يُذكر بشكل صريح في القوانين.',
  'ممنوع نشر معلومات شخصية عن أي عضو مثل البريد أو رقم الهاتف بدون إذنه.',
  'يُمنع استخدام الحسابات المزيفة أو أسماء وهمية داخل الجروب.',
  'في حالة حدوث خلاف بين الأعضاء يجب الرجوع إلى صاحب الجروب أو أحد الإدمنز لحل المشكلة.',
  'ممنوع نشر محتوى مُعاد نشره بكثرة بشكل يسبب إزعاج لباقي الأعضاء.',
  'العضو الذي يتم طرده من الجروب لا يحق له المطالبة بالعودة إلا بموافقة صاحب الجروب.',
  'أي اقتراحات لتطوير الجروب أو تعديل القوانين يتم مناقشتها مع الإدمنز أولاً.',
  'عدم استغلال الجروب للترويج لمجموعات أو صفحات أخرى بدون إذن مُسبق.',
  'في حال تكرار المخالفات من عضو معين، يحق للإدمنز اتخاذ إجراءات تدريجية تبدأ بالتحذير وتنتهي بالحظر النهائي.',
  'الصور أو الفيديوهات المسيئة أو التي تنتهك حقوق النشر سيتم حذفها مباشرة وحظر ناشرها.',
  'لا يُسمح بتغيير صورة أو وصف الجروب إلا من خلال صاحب الجروب أو بإذن مباشر منه.',
  'أي عضو يتسبب في إثارة مشاكل متكررة سيتم حظره حتى وإن لم يخالف القوانين نصيًا.',
  'الحفاظ على خصوصية الجروب واجب، ولا يُسمح بنقل محتواه إلى الخارج إلا بموافقة صاحب الجروب.',
  'المشاركة الإيجابية مطلوبة، والعضو غير النشط لفترات طويلة قد يتم حذفه للحفاظ على تفاعل الجروب.',
  'يمنع نشر أي محتوى يحتوي على برامج ضارة أو روابط مشبوهة قد تؤذي الأجهزة أو الأعضاء.',
  'يُحظر التنمر أو المضايقة المستمرة لأي عضو مهما كان السبب.',
  'المشاركات يجب أن تكون واضحة ومفهومة، وتجنب استخدام لغة مبهمة أو رموز غير مفهومة.',
  'يُمنع نشر محتوى تجاري بدون موافقة صاحب الجروب أو أحد الإدمنز.',
  'أي محاولة لتزوير العضويات أو القرعة على المكافآت سيتم التعامل معها كخرق جسيم للقوانين.'
]

export default function GroupRules() {
  const { groupName } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [groupName])

  const checkAccess = async () => {
    try {
      await checkGroupAccess(groupName)
      setLoading(false)
    } catch (err) {
      navigate(`/groups/${groupName}`, { replace: true })
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography textAlign="center">جاري التحميل...</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={4}>
        <IconButton onClick={() => navigate(`/groups/${groupName}/dashboard`)}>
          <ArrowBackIcon />
        </IconButton>
        <GavelIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            قواعد المجموعة
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {groupName}
          </Typography>
        </Box>
      </Stack>

      {/* Admin Rules */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            p: 1.5, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AdminIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              حقوق وصلاحيات صاحب الموقع
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              صلاحيات كاملة لإدارة المنصة
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', p: 3, borderRadius: 2 }}>
          {ADMIN_RULES.map((rule, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 2,
                transition: 'all 0.3s',
                direction: 'rtl',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                '&:hover': {
                  bgcolor: 'white',
                  transform: 'translateX(-8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                }
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  color: 'text.primary',
                  lineHeight: 1.8
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#667eea',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    ml: 1.5,
                    mr: 0.5
                  }}
                >
                  {index + 1}
                </Box>
                {rule}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* General Rules */}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Box sx={{ 
            bgcolor: 'primary.light', 
            p: 1.5, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography fontSize={32}>📋</Typography>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary">
              القواعد العامة للمجموعة
            </Typography>
            <Typography variant="body2" color="text.secondary">
              قواعد يجب على جميع الأعضاء الالتزام بها
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ mt: 3 }}>
          {GENERAL_RULES.map((rule, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2.5,
                bgcolor: index % 2 === 0 ? 'action.hover' : 'transparent',
                borderRadius: 2,
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                transition: 'all 0.3s',
                direction: 'rtl',
                '&:hover': {
                  bgcolor: 'action.selected',
                  transform: 'translateX(-8px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  lineHeight: 1.8
                }}
              >
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    ml: 1.5,
                    mr: 0.5
                  }}
                >
                  {index + 11}
                </Box>
                {rule}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Warning Box */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography fontSize={40}>⚠️</Typography>
          <Typography variant="h5" fontWeight={700}>
            تنبيه مهم
          </Typography>
        </Stack>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 3, borderRadius: 2 }}>
          <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right', lineHeight: 1.8, mb: 2 }}>
            عدم الالتزام بهذه القواعد قد يؤدي إلى اتخاذ إجراءات تأديبية تتراوح بين التحذير والحظر النهائي من المجموعة.
          </Typography>
          <Typography variant="body2" sx={{ direction: 'rtl', textAlign: 'right', opacity: 0.95 }}>
            💡 جميع القرارات النهائية تعود لصاحب الموقع وصاحب المجموعة.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
