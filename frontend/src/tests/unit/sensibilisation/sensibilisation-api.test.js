import {
  createFormation,
  deleteFormation,
  downloadFormationDocument,
  getDashboard,
  getFormations,
  notifyParticipants,
  updateFormation,
  updateParticipantStatus,
  uploadFormationDocument,
} from '../../../api/sensibilisation';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe('api/sensibilisation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('dashboard et formations ajoutent le parametre societeId quand fourni', async () => {
    axiosInstance.get
      .mockResolvedValueOnce({ data: { total: 1 } })
      .mockResolvedValueOnce({ data: [{ id: 1 }] });

    await getDashboard(7);
    await getFormations(7);

    expect(axiosInstance.get).toHaveBeenNthCalledWith(1, '/api/sensibilisation/dashboard', {
      params: { societeId: 7 },
    });
    expect(axiosInstance.get).toHaveBeenNthCalledWith(2, '/api/sensibilisation', {
      params: { societeId: 7 },
    });
  });

  test('create update delete formation utilisent les routes attendues', async () => {
    const dto = { title: 'Sensibilisation phishing', date: '2026-05-23' };
    axiosInstance.post.mockResolvedValue({ data: { id: 1 } });
    axiosInstance.put.mockResolvedValue({ data: { id: 1 } });
    axiosInstance.delete.mockResolvedValue({ data: undefined });

    await createFormation(dto);
    await updateFormation(1, dto);
    await deleteFormation(1);

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/sensibilisation', dto);
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/sensibilisation/1', { id: 1, ...dto });
    expect(axiosInstance.delete).toHaveBeenCalledWith('/api/sensibilisation/1');
  });

  test('notifications et statut participant utilisent les payloads attendus', async () => {
    axiosInstance.post.mockResolvedValue({ data: { ok: true } });
    axiosInstance.put.mockResolvedValue({ data: { status: 'Present' } });

    await notifyParticipants(1, 'Rappel');
    await updateParticipantStatus(1, 2, 'Present');

    expect(axiosInstance.post).toHaveBeenCalledWith('/api/sensibilisation/1/notify', {
      title: 'Rappel',
    });
    expect(axiosInstance.put).toHaveBeenCalledWith('/api/sensibilisation/1/participants/2/status', {
      status: 'Present',
    });
  });

  test('uploadFormationDocument envoie un FormData multipart', async () => {
    const file = new File(['support'], 'support.pdf', { type: 'application/pdf' });
    const progress = jest.fn();
    axiosInstance.post.mockResolvedValue({ data: { id: 4 } });

    await uploadFormationDocument(1, file, progress);

    const [url, formData, config] = axiosInstance.post.mock.calls[0];
    expect(url).toBe('/api/sensibilisation/1/documents');
    expect(formData.get('file')).toBe(file);
    expect(config.headers).toEqual({ 'Content-Type': 'multipart/form-data' });

    config.onUploadProgress({ loaded: 25, total: 100 });
    expect(progress).toHaveBeenCalledWith(25);
  });

  test('downloadFormationDocument cree un lien blob', async () => {
    const link = document.createElement('a');
    const click = jest.fn();
    link.click = click;
    jest.spyOn(document, 'createElement').mockReturnValue(link);
    jest.spyOn(document.body, 'appendChild');
    jest.spyOn(document.body, 'removeChild');
    window.URL.createObjectURL = jest.fn(() => 'blob:formation');
    window.URL.revokeObjectURL = jest.fn();
    axiosInstance.get.mockResolvedValue({
      data: new Blob(['support']),
      headers: { 'content-type': 'application/pdf' },
    });

    await downloadFormationDocument(1, 4, 'support.pdf');

    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/api/sensibilisation/1/documents/4/download',
      { responseType: 'blob' }
    );
    expect(click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:formation');
  });
});
