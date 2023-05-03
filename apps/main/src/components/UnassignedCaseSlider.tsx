import Grid from '@mui/material/Grid';
import { A11y, Keyboard, Mousewheel, Scrollbar } from 'swiper';
import 'swiper/css';
import 'swiper/css/scrollbar';
import { Swiper, SwiperSlide } from 'swiper/react';

import { trpc } from '@mediature/main/src/client/trpcClient';
import styles from '@mediature/main/src/components/UnassignedCaseSlider.module.scss';
import { centeredAlertContainerGridProps } from '@mediature/main/src/utils/grid';
import { wideContainerGridProps } from '@mediature/main/src/utils/grid';
import { linkRegistry } from '@mediature/main/src/utils/routes/registry';
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
      assigned: false,
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
    return (
      <Grid
        container
        sx={{
          ...wideContainerGridProps.sx,
          py: 0,
          maxWidth: 'lg',
          mx: 'auto',
        }}
      >
        <span role="alert">Il n&apos;y a aucun nouveau dossier à traiter</span>
      </Grid>
    );
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
            <UnassignedCaseSliderCard
              caseLink={linkRegistry.get('case', {
                authorityId: caseWrapper.case.authorityId,
                caseId: caseWrapper.case.id,
              })}
              case={caseWrapper.case}
              citizen={caseWrapper.citizen}
              attachments={caseWrapper.attachments || []}
              unprocessedMessages={caseWrapper.unprocessedMessages || 0}
              assignAction={assignAction}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  );
}
