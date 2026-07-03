import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  let errorMessage = "An unknown error occurred";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div style={{ padding: '2rem', color: 'red' }} className='flex flex-col h-full justify-center items-center gap-6'>
      <h1 className='text-4xl'>Oops!</h1>
      <p className='text-3xl'>Sorry, an unexpected error has occurred.</p>
      <p className='text-3xl'><i>{errorMessage}</i></p>
    </div>
  );
}
