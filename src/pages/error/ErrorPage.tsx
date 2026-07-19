import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import errorImg from '@/assets/error-page-image.png';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { normalizeError } from '@/utilities/normalized-error';

type Params = {
  name: string,
  url: string
}

export default function ErrorPage(params: Params) {
  //useRouteError() is typed as unknown because errors can come from loaders, actions, component rendering, or arbitrary thrown values.
  const error = useRouteError();
  const navigate = useNavigate();
  let errorMessage;
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else {
    errorMessage = normalizeError(error).message;
  }

  return (
    <div className='flex flex-col m-auto justify-center self-center bg-card w-[360px] sm:w-[500px] p-8 sm:p-15 h-fit rounded-4xl shadow-2xl gap-5'>
      <img src={errorImg} alt="" className='min-w-2xs mb-7' />
      <div className='flex flex-col'>
        <p className='text-2xl font-medium mb-6'>Oops! Something went wrong</p>
        <p className='text-muted-foreground font-medium leading-normal'>{errorMessage}
          <br /> You can go back to {params.name} and try again.</p>
      </div>
      <div className='flex flex-col gap-3'>
        <Button variant={'default'} onClick={() => navigate(params.url)}>
          <ArrowLeft />
          Go Back</Button>
        <Button variant={'ghost'} className='' onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>
  );
}
