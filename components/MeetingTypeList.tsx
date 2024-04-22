"use client"

import React, { useState } from 'react'
import HomeCard from './HomeCard'
import { useRouter } from 'next/navigation'
import MeetingModal from './MeetingModal'
import { useUser } from '@clerk/nextjs'
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk'
import { useToast } from './ui/use-toast'
import { Textarea } from './ui/textarea'
import ReactDatePicker from 'react-datepicker'

const MeetingTypeList = () => {
  const router = useRouter()
  const [meetingState, setMeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>()

  const { user } = useUser()
  const client = useStreamVideoClient()

  const [values, setValues] = useState({
    dateTime: new Date(),
    description: '',
    link: '',
  })

  const [callDetails, setCallDetails] = useState<Call>()

  const { toast } = useToast()

  const createMeeting = async () => {
    if (!client || !user) return;

    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' })
        return
      }

      const id = crypto.randomUUID()

      const call = client.call('default', id)

      if (!call) throw new Error('Failed to create call');

      const startsAt = values.dateTime.toISOString() || new Date(Date.now()).toISOString()

      const description = values.description || 'Reunión Instantánea';
      
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description
          }
        }
      })

      setCallDetails(call)

      if (!values.description) {
        router.push(`/meeting/${call.id}`)
      }

      toast({ title: 'Reunión creada' })
    } catch (error) {
      console.log(error)
      toast({
        title: "Hubo un error al crear la sala de reunión"
      })
    }
  }

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`

  return (
    <section className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4'>
      <HomeCard 
        img="/icons/add-meeting.svg"
        title="Nueva reunión"
        description="Empieza una reunión al instante"
        handleClick={() => setMeetingState('isInstantMeeting')}
        className="bg-orange-1"
      />
      <HomeCard 
        img="/icons/schedule.svg"
        title="Organiza una reunión"
        description="Planifica aquí una reunión"
        handleClick={() => setMeetingState('isScheduleMeeting')}
        className="bg-blue-1"
      />
      <HomeCard 
        img="/icons/recordings.svg"
        title="Ver grabaciones"
        description="Revisa tus grabaciones"
        handleClick={() => router.push('/recordings')}
        className="bg-purple-1"
      />
      <HomeCard 
        img="/icons/join-meeting.svg"
        title="Unirse a una reunión"
        description="Unirse mediante enlace de invitación"
        handleClick={() => setMeetingState('isJoiningMeeting')}
        className="bg-yellow-1"
      />

      {!callDetails ? (
        <MeetingModal 
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Crea una reunión"
          handleClick={createMeeting}
        >
          <div className='flex flex-col gap-2.5'>
            <label className="text-base text-normal leading-[22px] text-sky-2">Añadir descripción</label>
            <Textarea className='border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0' onChange={(e) => {
              setValues({...values, description: e.target.value}) 
            }} />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className='text-base text-normal leading-[22px] text-sky-2'>Elige fecha y hora</label>
            <ReactDatePicker 
              selected={values.dateTime}
              onChange={(date) => setValues({...values, dateTime: date! })}
              showTimeSelect
              timeFormat='HH:mm'
              timeIntervals={15}
              timeCaption='time'
              dateFormat="MMMM d, yyyy h:mm aa"
              className='w-full rounded bg-dark-3 p-2 focus:outline-none'
            />
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal 
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Reunión Creada"
          className="text-center"
          buttonText="Copiar invitación"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink)
            toast({ title: 'Link copied' })
          }}
          image='/icons/checked.svg'
          buttonIcon="/icons/copy.svg"
        />
      )}
      <MeetingModal 
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Empieza una reunión al instante"
        className="text-center"
        buttonText="Empezar reunión"
        handleClick={createMeeting}
      />
    </section>
  )
}

export default MeetingTypeList