import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export interface GoogleReviewItem {
  id: string;
  author_name: string;
  author_photo: string;
  rating: number;
  time: string;
  text: string;
  verified?: boolean;
  local_guide?: boolean;
}

export interface ReviewsConfig {
  animationType: "marquee" | "carousel" | "grid";
  speed: "slow" | "normal" | "fast";
  rotateTime: number; // in milliseconds for carousel (e.g. 4500)
  business: {
    name: string;
    address: string;
    rating: number;
    totalReviews: number;
    mapUrl: string;
  };
  reviews: GoogleReviewItem[];
}

export const DEFAULT_REVIEWS_CONFIG: ReviewsConfig = {
  animationType: "marquee",
  speed: "normal",
  rotateTime: 4500,
  business: {
    name: "Corta la fruta",
    address: "Nicolás Videla 173, B1874 Quilmes, Provincia de Buenos Aires",
    rating: 4.8,
    totalReviews: 29,
    mapUrl: "https://maps.app.goo.gl/Uc8cmMc5MBuLm5pX8",
  },
  reviews: [
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2xoNmFrSnlXR3czTFRWM05tTmtXWGc0TW00eGRIYxAB",
        "author_name": "Flor Camiscia",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocJgkVHxO9Q1g7HaiEnGtM5BsWew-6dVeESfgRWk0-Eomp8M4mIj=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Corta La Fruta es una joyita! Las frutas están fresquísimas y las combinaciones con yogur y granola son super ricas! Es de esos lugares donde entrás y te atienden con buena onda de verdad. Ideal para picar algo saludable sin perder tiempo. Recomendadísimo para eventos y cumples de los chicos!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2tOR1MycFlSSE5JTjA0elltdEtkbmRSVDBkWVZtYxAB",
        "author_name": "Georgina",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjW-KROjvsC4vDOSRynkro8OMGgG2QbHoBVrx7KNJspBiA_3dzId3g=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 2 meses",
        "text": "Todo riquísimo, fresco, excelente calidad y atención suprema!!!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25wWlFVTmhOSEpYT1ZwVE1uVnNRblExT0ZnNFdIYxAB",
        "author_name": "Pao R.",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjW9yCa875QNxpH8k4Ho8TMzy_QZMPOl8aZyxsZwqUR2FQ4galvU=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 8 meses",
        "text": "Muy bueno! Fruta fresca, yogur rico. Recomiendo",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT21WR1p6TnRhak5wZDJOSVEwMVljRkI2YkdOclZYYxAB",
        "author_name": "Alicia Druetta",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocKTZpgYZueqcuKb9d1AUl5V6tnSwhpHf6VlVLg0AzMB2vYcJg=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Deliciosa comida, fresca y liviana. Perfecta para estos días de calor. La atención es amorosa y dedicada. Muy recomendable.",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25wVFJteEdWR05FV0hoMFgyNXhTMVZIV0ROTFpVRRAB",
        "author_name": "Mora Acuña",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjWHolP-sr7RNZpoeh30lk1cQlgw7KrKy1yIwsv9k3J1XTkAulc=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Es un excelente lugar fui con mi mamá y nos dejaron probar y las ensaladas son riquísimas todo saludable muy buena atención  la dueña una genia y el vaso de fruta te lo hacen a el momento 😍",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25CSVJIWjVTRGh1YUZaNE5tOHRMVTlxWlZSS2VYYxAB",
        "author_name": "Car Rial",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUC4FQP5PMn6Z0SYmJhTBP0sSUrr9FFkIvGamS-I_2Y3bLHThua_w=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 7 meses",
        "text": "Nos encantó todo!!!! Desde la atención, que la chica que te recibe es una genia hasta todas las variedades que tienen!!!! Super recomendable la panacota!!!!! Nos vemos pronto!!",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT21sUVNVdFNlV3R1WDJKWVdsWXllRWhsT0ROeWJYYxAB",
        "author_name": "Pilar Ottobre",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjVKdDkEr9cEFH57QRplG3rfNL2nobhyjBE_LqimHsIryLvXsMXxyw=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 13 meses",
        "text": "Probé un vaso de avena trasnochada con crema de maracuya casera y frutillas, estaba riquísimo, súper fresco. Tienen de todo en el local, vale la pena probar cada producto. La vendedora es muy copada y servicial. Esta bueno que Quilmes tenga un local con esa linda energía y con productos saludables",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2pKSlEzYzNPVVp0YjFOalJ6VnRSbXBIVjJ0TGFrRRAB",
        "author_name": "Giuli",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUbfnWX6iwDc3ablQzWlb6e1eBhofB-8dlUoPnN7Rg3P80hGFCoRQ=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 7 meses",
        "text": "Riquísimo y super fresco todo lo que tienen! Las chicas super agradables 🥰",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2pkWlZqaHZSREV3TFdwQlZ6aFFNbFpSUzNsTlRuYxAB",
        "author_name": "Fernanda Honorato",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjXq2OTF5VgD978ByIsF2eQYL0M7t9Ds6TeI_jPABRw9IKS0rylz=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 12 meses",
        "text": "Delicia los bowls y ensalada! Vale la pena. Pruebe",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT21FNVVERTFSRmRITVU5WFlpMWpOWGMzYkZsRmNrRRAB",
        "author_name": "Mauro Pasquini",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocLKUu7EqU4IyofdzambKFdqocFKFjC64fbSWL5NyEm6zuxWxA=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "La idea es genial. Buenísima toda la fruta bien fresca y dulce. Para días de calor va de 10",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25wbFlYbDNZMVpsYVdseVExaDViekl0ZFhOMkxVRRAB",
        "author_name": "Cecilia Edith Yurquina",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocIXur7C7hYoqWcP4wJhRdUyNrLVj0wYvzG6QgrLAeSofu5k6g=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 13 meses",
        "text": "Las chicas que nos atendieron son muy amables y atentas,  pedimos dos vasos de fruta que estaban muy fresco y delicioso, una porción de torta riquísima, el lugar es super recomendable!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT210TVVGcDRTRzlqTlhCUFJUaDBRekkxWVRKWmIyYxAB",
        "author_name": "Romina Valeria Del Castillofcssnd",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocJHN0d45_fAUiCOr3PDWWuzIwpT0eGs294maKlH1OInV1_WSw=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Todo riquísimo y súper sano!!! La mejor atención!!! Me enamoré de este lugar",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2tsUlZXUkZSVkpDVUhWNk9HbEZSR3RUUmtoWFNWRRAB",
        "author_name": "Nadia Silva Rey",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocJEuFkvSVPwQLdSdtgFGiOoKMei-z-quezwGBHT7bqgZwoT0w=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 10 meses",
        "text": "Excelente atención y dedicada atención. Muy prolija la presentación y el local. Voy a volver!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25OSU1EbFZTWHBKV0dKaVRtRTBUMWxqV0U1NWMwRRAB",
        "author_name": "Jose Ignacio Pastorino",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjXpg6HAGoz1vxM7R8i-a66giN6KWbGoXrzZSiIHM6FUrFvIxmamrw=s64-c-rp-mo-ba12-br100",
        "rating": 4,
        "time": "Hace 6 meses",
        "text": "Muy buena propuesta Excelente atencion",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25kRVlWZFBORk14VlVSdWFYcEdkblpHYjAxMWFGRRAB",
        "author_name": "Yili Cervecera",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUs5hO2tNNTNR9Myt6kfv_9C6nufQul74ySEpfzBBy2NPOmEVQdUA=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 10 meses",
        "text": "Son exelentes todos los productos frutilla acon crema , yogurt griego paltas ensaladas etc y la atención es y. 10",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2xSR1MyaEpVREJEUnpGUVMwRXllVzFVTTJGd1JFRRAB",
        "author_name": "Cecilia m",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUXEB4it6je7vYmMrJ9Rbv8SVt3npkUbvYFQEPm0j2ULdLAVKc=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 15 meses",
        "text": "Muy buenos productos, saludables, y excelentes precios.  Las frutillas con chocolate riquísimas. Sin duda volveremos. Éxitos!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25wWVdVTlZkRE5mYkdGdGRqZHdXbkpGWDFFM2JrRRAB",
        "author_name": "Avsalmohadas Sosa",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocIsaV24CdcByTntqQKNfmNs-GWYPy6yNSO1nPjbnhNgranF2w=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Super sano, super rico las frutas muy frescas, el yogur un éxito.",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT21ScVR6bGlOSGxDY0dSR2JreDVlVGRXYzBoWVZXYxAB",
        "author_name": "carla rakauskas",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocJI9YUyoWsLRSFwR-FBo3MoSFXiSQ3sUgSqgAx00hQiXkeThA=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Super recomendable saludable,sano,rico y las chicas que atienden unas genias son lo mas lo recomiendo !!!!",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25CWWFtUlhhemhZWjJvNGJqTm1kM2RmVG1sbFkxRRAB",
        "author_name": "Maximiliano Armoa",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjWYHsRruzk1L33IIEdZR_ashjgfWEDpJdqIxatRWVYgSvm8Tck=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 15 meses",
        "text": "Excelente lugar y la atención maravillosa...las ensaladas son excelentes y las frutas muy ricas",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2xJM1oxSXllVXBvV0U1MFpGQjROMVZKZFV0clRWRRAB",
        "author_name": "Celina Andrada",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocLQ8SuJKQKbx-1F5-Ut4G-872odPH97veFUu3yBiQ_LtQWItw=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 10 meses",
        "text": "Riquisimo todoo, me obsesioné con los vasitos, recomiendo 10/10",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25OeFpHcDNTbTB3WVVoM1JtUmxiREpTYjFadlFrRRAB",
        "author_name": "Melina Di Gallo",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocIttTwrvtWcJeKASmypFujT_5OGF6tY841Bwriv5uZp9XDY5A=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 14 meses",
        "text": "Fui y comí fruta! Todoo estaba súper fresco lo re recomiendo !!!",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT21SbWNVOWxORzVDUzFSUVdYbHFSRVZTV214WFZuYxAB",
        "author_name": "Cynthia Gomez",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUqxh0h942NjfPk_9QQQ7tfOneLfsqhyXS5pp8ZeUjKvjJFUgdF=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 12 meses",
        "text": "Muy buena atención y todo super fresco",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2xoeWRrRlNSMlZaU1ZCYWJFbE9kbEI1VUU1T2NsRRAB",
        "author_name": "ELISABET CALDERON",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUI8Dg7xkec843qj-7S9SDm5Xa-HWiZ_e-WhKxlQ8kqZVQdh49uag=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 14 meses",
        "text": "Muy rico todo y buena atención",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2taMWVFOXFWbWsxU1haRVdETm5UakpqZEZSamVXYxAB",
        "author_name": "Raúl Acuña",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjXlGaRlflgQa9MQJLCdrtgnDQ_Yl6PHPw0CBkcMeUElZPU--10=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 15 meses",
        "text": "Un éxito el lugar, la comida y la atención. Muy recomendable.",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25CQk5WZHllbGh0VjI0elpXSnNSREJZVVhwNVIzYxAB",
        "author_name": "Veronica Roble",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocKV-DvUtfElvVneATF95ZWu__ybDIFZy03J_PUsuGHEv7Z7xQ=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 11 meses",
        "text": "Muy buena, rica, necesaria idea ..",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2xKelRFMDBZelpqVm1FeWQwY3dRbGRSTTA1MU5rRRAB",
        "author_name": "Florencia Franceschinis",
        "author_photo": "https://lh3.googleusercontent.com/a/ACg8ocJCIyv1ahyK4v7Fox7pjvGJV9hPAtI6lIvnXAiiItsugPyoOQ=s64-c-rp-mo-ba12-br100",
        "rating": 5,
        "time": "Hace 15 meses",
        "text": "Todo fresco y deliciosas opciones !!",
        "verified": true,
        "local_guide": true
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT25GcllqaFJYMkZuU0V4bk5YcENkRkJNYnpSVVZIYxAB",
        "author_name": "Julieta Lopez",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjVCFUmf9zKbaNsY8M-Xh7BAiMEX4qQYh47Qrb-zHJPY4-AS98iO=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 9 meses",
        "text": "Riquisimooo, me encanto!",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2pGVFpGbFJSVlpxZVhnd2VESTVlWGsxT1U1V09YYxAB",
        "author_name": "Rocio Santamarina",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjXeaRAdaHaIAnzOEPDfTmwZ9nF5iXtB104Y-Rb3chCkK_tUBBU1fA=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 1 mes",
        "text": "Excelente atención y todo muy rico. Me gustó mucho la variedad de opciones ✨",
        "verified": true,
        "local_guide": false
    },
    {
        "id": "google-Ci9DQUlRQUNvZENodHljRjlvT2tKTmRuTjFUbXhUY0hKeGIwWklUREI1WkhoeVFXYxAB",
        "author_name": "Gabriela A López",
        "author_photo": "https://lh3.googleusercontent.com/a-/ALV-UjUarcMMCksgS1l-IRNP0s16u5lCkzz3NBGNGLI4lpIyII9XkNoxyA=s64-c-rp-mo-br100",
        "rating": 5,
        "time": "Hace 2 meses",
        "text": "El mejor lugar para comer rico y sano💚💚🥰 Comida novedosas nada de ensaladas tradicionales",
        "verified": true,
        "local_guide": false
    }
]
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('description')
      .eq('id', 'corta-la-fruta-reviews')
      .single();

    if (error || !data || !data.description) {
      return NextResponse.json(DEFAULT_REVIEWS_CONFIG);
    }

    try {
      const parsedConfig = JSON.parse(data.description);
      return NextResponse.json({
        ...DEFAULT_REVIEWS_CONFIG,
        ...parsedConfig,
        business: {
          ...DEFAULT_REVIEWS_CONFIG.business,
          ...(parsedConfig.business || {}),
        },
        reviews: Array.isArray(parsedConfig.reviews) && parsedConfig.reviews.length > 0 
          ? parsedConfig.reviews 
          : DEFAULT_REVIEWS_CONFIG.reviews
      });
    } catch {
      return NextResponse.json(DEFAULT_REVIEWS_CONFIG);
    }
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    return NextResponse.json(DEFAULT_REVIEWS_CONFIG);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.reviews)) {
      return NextResponse.json(
        { error: 'Datos de configuración de reseñas inválidos.' },
        { status: 400 }
      );
    }

    const payload = {
      id: 'corta-la-fruta-reviews',
      name: 'Reseñas de Google Maps',
      description: JSON.stringify(body),
      price: 5.0,
      category: 'Reseñas',
      image_urls: [
        'https://lh6.googleusercontent.com/-eZuODKrV83g/AAAAAAAAAAI/AAAAAAAAAAA/F82b9cxxizQ/s44-p-k-no-ns-nd/photo.jpg'
      ]
    };

    const { error } = await supabase
      .from('menu_items')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error updating reviews in Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: body });
  } catch (err: any) {
    console.error('Error in reviews POST:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
