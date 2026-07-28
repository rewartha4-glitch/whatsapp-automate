import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AddJourney() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [journeyId, setJourneyId] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('62216505555');
  const [steps, setSteps] = useState<any[]>([
    { id: 'step-1', action: 'sendMessage', text: '' },
    { id: 'step-2', action: 'waitForResponse', expected: '' },
    { id: 'step-3', action: 'takeScreenshot' }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      setLoading(true);
      fetch(`/api/journey/${editId}`)
        .then(res => res.json())
        .then(data => {
          setJourneyId(data.id);
          setDescription(data.description);
          setPhone(data.phone);
          if (data.steps && data.steps.length > 0) {
            setSteps(data.steps.map((s: any) => ({ ...s, id: Math.random().toString() })));
          }
        })
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleAddStep = (type: 'sendMessage' | 'waitForResponse' | 'takeScreenshot' | 'validate') => {
    const id = Math.random().toString();
    if (type === 'sendMessage') setSteps([...steps, { id, action: 'sendMessage', text: '' }]);
    if (type === 'waitForResponse') setSteps([...steps, { id, action: 'waitForResponse', expected: '' }]);
    if (type === 'validate') setSteps([...steps, { id, action: 'validate', expected: '' }]);
    if (type === 'takeScreenshot') setSteps([...steps, { id, action: 'takeScreenshot' }]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleChangeStep = (index: number, field: string, value: string | boolean) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const newSteps = Array.from(steps);
    const [reorderedItem] = newSteps.splice(result.source.index, 1);
    newSteps.splice(result.destination.index, 0, reorderedItem);
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!journeyId || !description) return toast.error('Journey ID and Description are required');
    
    // Clean up empty fields
    const cleanedSteps = steps.map(s => {
      const step: any = { action: s.action };
      if (s.action === 'sendMessage' && s.text) step.text = s.text;
      if (s.action === 'waitForResponse') {
        if (s.expected) step.expected = s.expected;
        if (s.extractVar) {
          step.extractVar = s.extractVar;
          step.extractRegex = s.extractRegex;
        }
      }
      if (s.action === 'validate' && s.expected) {
         step.type = 'contains';
         step.expected = s.expected;
      }
      return step;
    });

    try {
      const res = await fetch('/api/journey/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyId,
          description,
          phone,
          steps: cleanedSteps
        })
      });
      if (res.ok) {
        toast.success('Journey saved successfully!');
        navigate('/journeys');
      } else {
        toast.error('Failed to save journey');
      }
    } catch (e) {
      toast.error('Error saving journey');
    }
  };

  if (loading) return <div className="text-center p-8">Loading journey details...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{editId ? 'Edit Journey' : 'Add New Journey'}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Use the visual builder to create an automation flow</p>
        </div>
        <div className="flex gap-2">
          {editId && (
            <button onClick={() => navigate('/journeys')} className="btn btn-secondary">
              Back
            </button>
          )}
          <button onClick={handleSave} className="btn btn-primary">
            <Save size={18} style={{ marginRight: '0.5rem' }} />
            Save Journey
          </button>
        </div>
      </div>

      <div className="card mb-6 flex flex-col gap-4">
        <div>
          <label className="label">Journey ID (e.g. FLOW_15_BARU)</label>
          <input className="input" value={journeyId} onChange={e => setJourneyId(e.target.value)} placeholder="FLOW_..."/>
        </div>
        <div>
          <label className="label">Description / Intention</label>
          <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Misal: Cek Harga Service"/>
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Steps Builder</h2>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="steps-list">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="flex flex-col gap-3 mb-6"
            >
              {steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="card flex items-center gap-4" 
                      style={{ 
                        ...provided.draggableProps.style,
                        padding: '1rem', 
                        backgroundColor: 'var(--bg-primary)',
                        boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0,0,0,0.2)' : undefined,
                        border: snapshot.isDragging ? '1px solid var(--accent-primary)' : undefined
                      }}
                    >
                      <div 
                        {...provided.dragHandleProps} 
                        style={{ color: 'var(--text-secondary)', cursor: 'grab', padding: '0.5rem' }}
                      >
                        <GripVertical size={20} />
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', width: '20px' }}>{index + 1}.</div>
                      <div style={{ width: '150px' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {step.action}
                        </span>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        {step.action === 'sendMessage' && (
                          <input 
                            className="input" 
                            placeholder="Text to send..." 
                            value={step.text || ''} 
                            onChange={e => handleChangeStep(index, 'text', e.target.value)}
                          />
                        )}
                        {step.action === 'waitForResponse' && (
                          <div className="flex flex-col gap-2">
                            <input 
                              className="input" 
                              placeholder="Expected response substring..." 
                              value={step.expected || ''} 
                              onChange={e => handleChangeStep(index, 'expected', e.target.value)}
                            />
                            <div className="flex gap-2 items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={!!step.extractVar} 
                                  onChange={e => handleChangeStep(index, 'extractVar', e.target.checked ? 'var_name' : '')} 
                                />
                                Extract Variable?
                              </label>
                            </div>
                            {step.extractVar !== undefined && step.extractVar !== '' && (
                              <div className="flex gap-2">
                                <input 
                                  className="input" 
                                  placeholder="Variable Name (e.g. otp)" 
                                  value={step.extractVar} 
                                  onChange={e => handleChangeStep(index, 'extractVar', e.target.value)}
                                />
                                <input 
                                  className="input" 
                                  placeholder="Regex (e.g. Kode: (\d+))" 
                                  value={step.extractRegex || ''} 
                                  onChange={e => handleChangeStep(index, 'extractRegex', e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        {step.action === 'validate' && (
                          <input 
                            className="input" 
                            placeholder="Text that MUST be present..." 
                            value={step.expected || ''} 
                            onChange={e => handleChangeStep(index, 'expected', e.target.value)}
                          />
                        )}
                        {step.action === 'takeScreenshot' && (
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Will take a screenshot of the chat</span>
                        )}
                      </div>

                      <button onClick={() => handleRemoveStep(index)} style={{ color: 'var(--error)', backgroundColor: 'transparent', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex gap-2">
        <button className="btn btn-secondary" onClick={() => handleAddStep('sendMessage')}><Plus size={16}/> Send Message</button>
        <button className="btn btn-secondary" onClick={() => handleAddStep('waitForResponse')}><Plus size={16}/> Wait Response</button>
        <button className="btn btn-secondary" onClick={() => handleAddStep('validate')}><Plus size={16}/> Validate Text</button>
        <button className="btn btn-secondary" onClick={() => handleAddStep('takeScreenshot')}><Plus size={16}/> Screenshot</button>
      </div>
    </div>
  );
}
