import { Grid } from '@mui/material';
import { A11y, Keyboard, Mousewheel, Pagination, Scrollbar } from 'swiper';
import 'swiper/css';
import 'swiper/css/scrollbar';
import { Swiper, SwiperSlide } from 'swiper/react';

import { trpc } from '@mediature/main/src/client/trpcClient';
import styles from '@mediature/main/src/components/UnassignedCaseSlider.module.scss';
import { centeredAlertContainerGridProps } from '@mediature/main/src/utils/grid';
import { ErrorAlert } from '@mediature/ui/src/ErrorAlert';
import { LoadingArea } from '@mediature/ui/src/LoadingArea';
import { UnassignedCaseSliderCard } from '@mediature/ui/src/UnassignedCaseSliderCard';

export interface UnassignedCaseSliderProps {
  authorityId: string;
  assignAction: (caseId: string) => Promise<void>;
}

export function UnassignedCaseSlider({ authorityId, assignAction }: UnassignedCaseSliderProps) {
  const { data, error, isInitialLoading, isLoading, refetch } = trpc.listCases.useQuery({
    orderBy: {},
    filterBy: {
      authorityIds: [authorityId],
      // assigned: false,
    },
  });

  const casesWrappers = data?.casesWrappers || [];

  if (error) {
    return (
      <Grid container {...centeredAlertContainerGridProps}>
        <ErrorAlert errors={[error]} refetchs={[refetch]} />
      </Grid>
    );
  } else if (isLoading) {
    return <LoadingArea ariaLabelTarget="liste des dossiers non-assignés" />;
  }

  if (!casesWrappers.length) {
    return <span role="alert">TODO: pas de nouveau dossier trouvé</span>;
  }

  return (
    <>
      <Swiper
        role="region"
        aria-roledescription="carrousel"
        aria-label="dossiers non-assignés"
        slidesPerView={'auto'}
        spaceBetween={18}
        centeredSlides={true}
        grabCursor={true}
        zoom={{
          toggle: false,
        }}
        resistance={true}
        resistanceRatio={0}
        autoHeight={false}
        a11y={{
          enabled: true,
        }}
        scrollbar={{
          enabled: false,
          draggable: true,
        }}
        mousewheel={false}
        keyboard={{
          enabled: true,
        }}
        modules={[A11y, Scrollbar, Mousewheel, Keyboard]}
        className={styles.swiper}
      >
        {casesWrappers.map((caseWrapper) => (
          <SwiperSlide key={caseWrapper.case.id} role="group" aria-roledescription="élément du carrousel" className={styles.swiperSlide}>
            <UnassignedCaseSliderCard case={caseWrapper.case} citizen={caseWrapper.citizen} assignAction={assignAction} />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
