
/**
 * Online Data Service using Gun.js
 * Optimized for multi-device private rooms.
 */

declare var Gun: any;

const peers = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://relay.peer.ooo/gun',
  'https://gundb-relay.up.railway.app/gun',
  'https://peer.wall.org/gun'
];

const gun = typeof Gun !== 'undefined' 
  ? Gun({ peers, localStorage: true, retry: 1000 })
  : null;

// Return a specific node based on the school code
const getSchoolNode = (code: string) => {
  const sanitizedCode = (code || 'default').toLowerCase().trim();
  return gun?.get('houaifi-v4').get(sanitizedCode);
};

export const OnlineService = {
  /**
   * Saves a record to a specific school room.
   */
  saveRecord: (schoolCode: string, record: any) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    node.get('records').get(record.id).put(record);
  },

  deleteRecord: (schoolCode: string, id: string) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    node.get('records').get(id).put(null);
  },

  /**
   * Subscribe to records of a specific school.
   */
  subscribeToRecords: (schoolCode: string, callback: (records: any[]) => void) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return;
    
    node.get('records').map().on((data: any, id: string) => {
      if (data === null) {
        callback([{ id, _deleted: true }]);
      } else if (data && data.studentName) {
        callback([{ ...data, id }]);
      }
    });
  },

  /**
   * Sync user account within the school room.
   */
  syncUser: (user: any) => {
    const node = getSchoolNode(user.schoolCode);
    if (!node) return;
    node.get('users').get(user.email).put({
      id: user.id,
      name: user.name,
      role: user.role,
      password: user.password,
      email: user.email,
      schoolCode: user.schoolCode
    });
  },

  /**
   * Find user in a specific school room.
   */
  findUser: (schoolCode: string, email: string, callback: (user: any) => void) => {
    const node = getSchoolNode(schoolCode);
    if (!node) return callback(null);
    node.get('users').get(email).once((user: any) => {
      if (user && user.email) callback(user);
      else callback(null);
    });
  }
};
