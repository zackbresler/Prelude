import { useProjectStore } from '@/store/projectStore';
import { Section, Input, ImageUpload, RichTextEditor } from '@/components/common';

export default function Venue() {
  const { getCurrentProject, updateVenue, addVenueImage, updateVenueImage, deleteVenueImage } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const { venue } = project;

  return (
    <div className="space-y-6">
      <Section title="Venue Information" description="Details about the recording location">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Venue Name"
            value={venue.name}
            onChange={(e) => updateVenue({ name: e.target.value })}
            placeholder="Studio or venue name"
          />
          <Input
            label="Room Name"
            value={venue.roomName || ''}
            onChange={(e) => updateVenue({ roomName: e.target.value })}
            placeholder="e.g., Studio A, Live Room"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={venue.address}
              onChange={(e) => updateVenue({ address: e.target.value })}
              placeholder="Full address"
            />
          </div>
          <Input
            label="Dimensions"
            value={venue.dimensions || ''}
            onChange={(e) => updateVenue({ dimensions: e.target.value })}
            placeholder="e.g., 30' x 40' x 16'"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={venue.contactPerson || ''}
              onChange={(e) => updateVenue({ contactPerson: e.target.value })}
              placeholder="Name"
            />
            <Input
              label="Contact Phone"
              value={venue.contactPhone || ''}
              onChange={(e) => updateVenue({ contactPhone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
        </div>
        <div className="mt-6">
          <RichTextEditor
            label="Acoustic Notes"
            value={venue.acousticNotes}
            onChange={(acousticNotes) => updateVenue({ acousticNotes })}
            placeholder="Describe the acoustic properties, any treatment, known issues..."
            rows={4}
          />
        </div>
      </Section>

      <Section title="Venue Images" description="Photos of the space, floor plans, etc.">
        <ImageUpload
          images={venue.images}
          onAdd={addVenueImage}
          onUpdate={updateVenueImage}
          onDelete={deleteVenueImage}
        />
      </Section>
    </div>
  );
}
