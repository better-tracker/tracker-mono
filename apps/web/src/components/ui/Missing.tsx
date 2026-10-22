import { ButtonLink } from './Button';
import { Heading } from './Heading';
import { Empty } from './Empty';

export function Missing() {
  return (
    <>
      <Heading
        title="NOT HERE."
        subtitle="THIS PAGE OR RECORD COULD NOT BE FOUND"
      />
      <Empty>
        <p>Let’s find your next step.</p>
        <ButtonLink to="/">Return to Today →</ButtonLink>
      </Empty>
    </>
  );
}
