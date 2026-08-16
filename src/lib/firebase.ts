import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '@/firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Dùng initializeFirestore + experimentalAutoDetectLongPolling thay vì getFirestore mặc định.
// Lý do: với gRPC-stream/WebChannel bị một số mạng, proxy, trình duyệt (đặc biệt mobile) chặn/ngắt,
// các Promise của addDoc/updateDoc có thể mất nhiều giây (hoặc lâu hơn) để nhận phản hồi từ server.
//
// QUAN TRỌNG: bật persistentLocalCache (lưu vào IndexedDB của trình duyệt) để mọi thay đổi
// (thêm/sửa/xóa lịch) được ghi BỀN VỮNG vào máy NGAY LẬP TỨC, trước cả khi có phản hồi từ
// server. Nhờ vậy, nếu mạng chậm/mất và người dùng tải lại trang hoặc khởi động lại app,
// dữ liệu vừa cập nhật KHÔNG bị mất - Firestore sẽ tự động đồng bộ lên server ngay khi có
// mạng trở lại. Trước đây không bật cache này nên các thay đổi chỉ tồn tại tạm trong bộ nhớ
// RAM của tab và biến mất hoàn toàn nếu trang được tải lại trước khi kịp gửi lên server.
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
